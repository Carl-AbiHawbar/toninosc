create or replace function public.update_order_line_quantity(
  p_order_line_id uuid,
  p_quantity numeric,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
  v_order orders%rowtype;
begin
  select current_profile_role() into v_role;

  if v_role not in ('admin', 'warehouse') then
    raise exception 'Only admin and warehouse users can edit order quantities';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select o.* into v_order
  from orders o
  join order_lines ol on ol.order_id = o.id
  where ol.id = p_order_line_id
  for update of o;

  if not found then
    raise exception 'Order line not found';
  end if;

  if v_order.status <> 'submitted' then
    raise exception 'Order quantities can only be edited before approval';
  end if;

  update order_lines
  set approved_quantity = p_quantity,
      edit_note = nullif(trim(p_note), '')
  where id = p_order_line_id;

  update orders
  set updated_at = now()
  where id = v_order.id;
end;
$$;

create or replace function public.adjust_stock_batch(
  p_stock_batch_id uuid,
  p_quantity_delta numeric,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
  v_batch stock_batches%rowtype;
begin
  select current_profile_role() into v_role;

  if v_role not in ('admin', 'warehouse') then
    raise exception 'Only admin and warehouse users can adjust stock';
  end if;

  if p_quantity_delta = 0 then
    raise exception 'Adjustment cannot be zero';
  end if;

  if nullif(trim(p_note), '') is null then
    raise exception 'Adjustment note is required';
  end if;

  select * into v_batch
  from stock_batches
  where id = p_stock_batch_id
  for update;

  if not found then
    raise exception 'Stock batch not found';
  end if;

  if v_batch.current_quantity + p_quantity_delta < 0 then
    raise exception 'Adjustment would make stock negative';
  end if;

  update stock_batches
  set current_quantity = current_quantity + p_quantity_delta
  where id = p_stock_batch_id;

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
    v_batch.stock_item_id,
    v_batch.id,
    v_batch.warehouse_id,
    'adjust',
    p_quantity_delta,
    auth.uid(),
    nullif(trim(p_note), '')
  );
end;
$$;

create or replace function public.upsert_stock_item(
  p_stock_item_id uuid,
  p_name text,
  p_category text,
  p_unit text,
  p_price numeric,
  p_requires_expiry boolean,
  p_average_order_qty numeric,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if current_profile_role() <> 'admin' then
    raise exception 'Only admin users can edit stock items';
  end if;

  if nullif(trim(p_name), '') is null or nullif(trim(p_category), '') is null or nullif(trim(p_unit), '') is null then
    raise exception 'Name, category, and unit are required';
  end if;

  if p_stock_item_id is null then
    insert into stock_items (name, category, unit, price, requires_expiry, average_order_qty, active)
    values (
      trim(p_name),
      trim(p_category),
      trim(p_unit),
      greatest(coalesce(p_price, 0), 0),
      coalesce(p_requires_expiry, true),
      greatest(coalesce(p_average_order_qty, 1), 0),
      coalesce(p_active, true)
    )
    returning id into v_id;
  else
    update stock_items
    set name = trim(p_name),
        category = trim(p_category),
        unit = trim(p_unit),
        price = greatest(coalesce(p_price, 0), 0),
        requires_expiry = coalesce(p_requires_expiry, true),
        average_order_qty = greatest(coalesce(p_average_order_qty, 1), 0),
        active = coalesce(p_active, true),
        updated_at = now()
    where id = p_stock_item_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Stock item not found';
    end if;
  end if;

  return v_id;
end;
$$;

create or replace function public.upsert_supplier(
  p_supplier_id uuid,
  p_name text,
  p_contact_name text,
  p_phone text,
  p_email text,
  p_lead_time_days integer,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if current_profile_role() <> 'admin' then
    raise exception 'Only admin users can edit suppliers';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Supplier name is required';
  end if;

  if p_supplier_id is null then
    insert into suppliers (name, contact_name, phone, email, lead_time_days, active)
    values (
      trim(p_name),
      nullif(trim(p_contact_name), ''),
      nullif(trim(p_phone), ''),
      nullif(trim(p_email), ''),
      greatest(coalesce(p_lead_time_days, 0), 0),
      coalesce(p_active, true)
    )
    returning id into v_id;
  else
    update suppliers
    set name = trim(p_name),
        contact_name = nullif(trim(p_contact_name), ''),
        phone = nullif(trim(p_phone), ''),
        email = nullif(trim(p_email), ''),
        lead_time_days = greatest(coalesce(p_lead_time_days, 0), 0),
        active = coalesce(p_active, true),
        updated_at = now()
    where id = p_supplier_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Supplier not found';
    end if;
  end if;

  return v_id;
end;
$$;
