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
  v_stock_name text;
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

  select id into v_warehouse_id from warehouses where active = true order by name, id limit 1;

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
      select name into v_stock_name from stock_items where id = v_line.stock_item_id;
      raise exception 'Not enough stock for %. Need % more.', coalesce(v_stock_name, v_line.stock_item_id::text), v_remaining;
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
