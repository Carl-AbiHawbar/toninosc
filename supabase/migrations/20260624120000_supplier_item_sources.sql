create table if not exists supplier_items (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  stock_item_id uuid not null references stock_items(id) on delete cascade,
  supplier_sku text,
  supplier_unit text,
  last_price numeric(12, 2) check (last_price is null or last_price >= 0),
  is_primary boolean not null default false,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, stock_item_id)
);

create unique index if not exists idx_supplier_items_one_primary
on supplier_items(stock_item_id)
where is_primary and active;

create index if not exists idx_supplier_items_supplier on supplier_items(supplier_id);
create index if not exists idx_supplier_items_stock_item on supplier_items(stock_item_id);

alter table supplier_items enable row level security;

do $$ begin
  create policy "authenticated read supplier items" on supplier_items
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admin warehouse manage supplier items" on supplier_items
    for all to authenticated
    using (current_profile_role() in ('admin', 'warehouse'))
    with check (current_profile_role() in ('admin', 'warehouse'));
exception when duplicate_object then null; end $$;

insert into supplier_items (
  supplier_id,
  stock_item_id,
  supplier_unit,
  last_price,
  is_primary,
  active
)
select
  supplier_id,
  id,
  unit,
  price,
  true,
  true
from stock_items
where supplier_id is not null
on conflict (supplier_id, stock_item_id) do update set
  supplier_unit = excluded.supplier_unit,
  last_price = excluded.last_price,
  is_primary = true,
  active = true,
  updated_at = now();

create or replace function public.set_primary_supplier(
  p_stock_item_id uuid,
  p_supplier_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_profile_role() not in ('admin', 'warehouse') then
    raise exception 'Only admin and warehouse users can change suppliers';
  end if;

  update supplier_items
  set is_primary = false, updated_at = now()
  where stock_item_id = p_stock_item_id;

  insert into supplier_items (stock_item_id, supplier_id, is_primary, active)
  values (p_stock_item_id, p_supplier_id, true, true)
  on conflict (supplier_id, stock_item_id) do update set
    is_primary = true,
    active = true,
    updated_at = now();

  update stock_items
  set supplier_id = p_supplier_id, updated_at = now()
  where id = p_stock_item_id;
end;
$$;

