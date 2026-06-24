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
  v_supplier_id uuid;
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

    v_supplier_id := coalesce(nullif(v_item->>'supplier_id', '')::uuid, p_supplier_id);

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
      v_supplier_id,
      nullif(trim(p_note), '')
    )
    returning id into v_batch_id;

    insert into supplier_items (
      supplier_id,
      stock_item_id,
      supplier_unit,
      last_price,
      active
    )
    select
      v_supplier_id,
      v_stock.id,
      v_stock.unit,
      v_stock.price,
      true
    where v_supplier_id is not null
    on conflict (supplier_id, stock_item_id) do update set
      supplier_unit = excluded.supplier_unit,
      last_price = excluded.last_price,
      active = true,
      updated_at = now();

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

