create or replace function public.next_order_number()
returns text
language sql
stable
as $$
  select 'TON-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(((select count(1) from orders where created_at::date = current_date) + 1)::text, 4, '0')
$$;

create or replace function public.create_order(
  p_branch_id uuid,
  p_status order_status,
  p_notes text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_line jsonb;
  v_item stock_items%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_status not in ('draft', 'submitted') then
    raise exception 'Orders can only be created as draft or submitted';
  end if;

  if jsonb_array_length(p_lines) = 0 then
    raise exception 'Order must contain at least one line';
  end if;

  insert into orders (order_number, branch_id, created_by_user_id, status, notes)
  values (next_order_number(), p_branch_id, auth.uid(), p_status, nullif(trim(p_notes), ''))
  returning id into v_order_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    select * into v_item
    from stock_items
    where id = (v_line->>'stock_item_id')::uuid and active = true;

    if not found then
      raise exception 'Unknown stock item %', v_line->>'stock_item_id';
    end if;

    insert into order_lines (
      order_id,
      stock_item_id,
      requested_quantity,
      approved_quantity,
      unit_price,
      branch_note
    )
    values (
      v_order_id,
      v_item.id,
      greatest((v_line->>'quantity')::numeric, 0),
      null,
      v_item.price,
      nullif(v_line->>'note', '')
    );
  end loop;

  return v_order_id;
end;
$$;

create or replace function public.receive_stock(
  p_warehouse_id uuid,
  p_supplier_id uuid,
  p_note text,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
  v_item jsonb;
  v_stock stock_items%rowtype;
  v_batch_id uuid;
begin
  select current_profile_role() into v_role;

  if v_role not in ('admin', 'warehouse') then
    raise exception 'Only admin and warehouse users can receive stock';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_stock
    from stock_items
    where id = (v_item->>'stock_item_id')::uuid and active = true;

    if not found then
      raise exception 'Unknown stock item %', v_item->>'stock_item_id';
    end if;

    if v_stock.requires_expiry and ((v_item->>'production_date') is null or (v_item->>'expiry_date') is null) then
      raise exception 'Production and expiry dates are required for %', v_stock.name;
    end if;

    insert into stock_batches (
      stock_item_id,
      warehouse_id,
      batch_number,
      production_date,
      expiry_date,
      original_quantity,
      current_quantity,
      supplier_id,
      note
    )
    values (
      v_stock.id,
      p_warehouse_id,
      trim(v_item->>'batch_number'),
      nullif(v_item->>'production_date', '')::date,
      nullif(v_item->>'expiry_date', '')::date,
      (v_item->>'quantity')::numeric,
      (v_item->>'quantity')::numeric,
      p_supplier_id,
      nullif(trim(p_note), '')
    )
    returning id into v_batch_id;

    insert into stock_movements (
      stock_item_id,
      stock_batch_id,
      warehouse_id,
      movement_type,
      quantity,
      actor_user_id,
      note
    )
    values (
      v_stock.id,
      v_batch_id,
      p_warehouse_id,
      'receive',
      (v_item->>'quantity')::numeric,
      auth.uid(),
      nullif(trim(p_note), '')
    );
  end loop;
end;
$$;

create or replace function public.approve_order_fefo(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
  v_line order_lines%rowtype;
  v_batch stock_batches%rowtype;
  v_remaining numeric;
  v_take numeric;
  v_order orders%rowtype;
  v_warehouse_id uuid;
begin
  select current_profile_role() into v_role;

  if v_role not in ('admin', 'warehouse') then
    raise exception 'Only admin and warehouse users can approve orders';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status <> 'submitted' then
    update orders set status = 'approved', updated_at = now() where id = p_order_id;
    return;
  end if;

  select id into v_warehouse_id from warehouses where active = true order by created_at limit 1;

  delete from order_line_allocations
  where order_line_id in (select id from order_lines where order_id = p_order_id);

  for v_line in select * from order_lines where order_id = p_order_id order by created_at
  loop
    v_remaining := coalesce(v_line.approved_quantity, v_line.requested_quantity);

    for v_batch in
      select *
      from stock_batches
      where stock_item_id = v_line.stock_item_id
        and warehouse_id = v_warehouse_id
        and current_quantity > 0
      order by expiry_date nulls last, received_date, created_at
      for update
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining, v_batch.current_quantity);

      update stock_batches
      set current_quantity = current_quantity - v_take
      where id = v_batch.id;

      insert into order_line_allocations (order_line_id, stock_batch_id, quantity)
      values (v_line.id, v_batch.id, v_take);

      insert into stock_movements (
        stock_item_id,
        stock_batch_id,
        warehouse_id,
        movement_type,
        quantity,
        branch_id,
        order_id,
        actor_user_id,
        note
      )
      values (
        v_line.stock_item_id,
        v_batch.id,
        v_warehouse_id,
        'pick',
        -v_take,
        v_order.branch_id,
        p_order_id,
        auth.uid(),
        v_order.order_number
      );

      v_remaining := v_remaining - v_take;
    end loop;

    if v_remaining > 0 then
      raise exception 'Not enough stock for order line %', v_line.id;
    end if;

    update order_lines
    set approved_quantity = coalesce(approved_quantity, requested_quantity)
    where id = v_line.id;
  end loop;

  update orders
  set status = 'approved', updated_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_status order_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
begin
  select current_profile_role() into v_role;

  if p_status = 'approved' then
    perform approve_order_fefo(p_order_id);
    return;
  end if;

  if v_role not in ('admin', 'warehouse', 'driver') then
    raise exception 'Not allowed to update order status';
  end if;

  update orders
  set status = p_status, updated_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.update_stock_price(p_stock_item_id uuid, p_price numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_profile_role() <> 'admin' then
    raise exception 'Only admin users can edit prices';
  end if;

  update stock_items
  set price = greatest(p_price, 0), updated_at = now()
  where id = p_stock_item_id;
end;
$$;
