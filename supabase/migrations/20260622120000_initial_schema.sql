create extension if not exists pgcrypto;

do $$ begin
  create type app_role as enum ('admin', 'branch_manager', 'warehouse', 'driver', 'finance', 'supplier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'draft',
    'submitted',
    'approved',
    'preparing',
    'packed',
    'assigned_to_driver',
    'out_for_delivery',
    'delivered',
    'invoiced',
    'paid',
    'problem',
    'cancel_requested',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type cancel_status as enum ('none', 'requested', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_status as enum ('pending', 'loaded', 'on_the_way', 'delivered', 'problem');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_status as enum ('tracked_only', 'unpaid', 'partial', 'paid', 'overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stock_movement_type as enum ('receive', 'adjust', 'pick', 'return');
exception when duplicate_object then null; end $$;

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  city text,
  phone text,
  is_franchise boolean not null default true,
  supplies_free boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  auth_email text not null unique,
  full_name text not null,
  role app_role not null,
  branch_id uuid references branches(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact_name text,
  phone text,
  email text,
  lead_time_days int not null default 3,
  active boolean not null default true
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  active boolean not null default true
);

create table if not exists stock_items (
  id uuid primary key default gen_random_uuid(),
  legacy_code text unique,
  name text not null,
  category text not null,
  unit text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  requires_expiry boolean not null default true,
  average_order_qty numeric(12, 2) not null default 1,
  supplier_id uuid references suppliers(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_batches (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items(id),
  warehouse_id uuid not null references warehouses(id),
  batch_number text not null,
  production_date date,
  expiry_date date,
  received_date date not null default current_date,
  original_quantity numeric(12, 2) not null check (original_quantity > 0),
  current_quantity numeric(12, 2) not null check (current_quantity >= 0),
  supplier_id uuid references suppliers(id),
  note text,
  created_at timestamptz not null default now(),
  unique (stock_item_id, warehouse_id, batch_number),
  check (
    (production_date is null and expiry_date is null)
    or (production_date is not null and expiry_date is not null and expiry_date > production_date)
  )
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items(id),
  stock_batch_id uuid references stock_batches(id),
  warehouse_id uuid not null references warehouses(id),
  movement_type stock_movement_type not null,
  quantity numeric(12, 2) not null,
  branch_id uuid references branches(id),
  order_id uuid,
  actor_user_id uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  branch_id uuid not null references branches(id),
  created_by_user_id uuid references profiles(id),
  status order_status not null default 'submitted',
  cancel_status cancel_status not null default 'none',
  cancel_requested_by uuid references profiles(id),
  cancel_requested_at timestamptz,
  cancel_decided_by uuid references profiles(id),
  cancel_decided_at timestamptz,
  cancel_note text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  stock_item_id uuid not null references stock_items(id),
  requested_quantity numeric(12, 2) not null check (requested_quantity > 0),
  approved_quantity numeric(12, 2) check (approved_quantity >= 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  edit_note text,
  branch_note text,
  created_at timestamptz not null default now()
);

create table if not exists order_line_allocations (
  id uuid primary key default gen_random_uuid(),
  order_line_id uuid not null references order_lines(id) on delete cascade,
  stock_batch_id uuid not null references stock_batches(id),
  quantity numeric(12, 2) not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  route_date date not null,
  driver_user_id uuid references profiles(id),
  status delivery_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists delivery_stops (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  order_id uuid not null references orders(id),
  branch_id uuid not null references branches(id),
  stop_number int not null,
  status delivery_status not null default 'pending',
  delivered_at timestamptz,
  note text
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  branch_id uuid not null references branches(id),
  order_id uuid not null references orders(id),
  invoice_date date not null default current_date,
  payable boolean not null default true,
  status invoice_status not null default 'unpaid',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'cash',
  note text,
  recorded_by uuid references profiles(id),
  paid_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_orders_branch_status on orders(branch_id, status);
create index if not exists idx_stock_batches_item_expiry on stock_batches(stock_item_id, expiry_date);
create index if not exists idx_stock_movements_batch on stock_movements(stock_batch_id);
create index if not exists idx_allocations_batch on order_line_allocations(stock_batch_id);

create or replace function current_profile_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid() and active = true
$$;

alter table branches enable row level security;
alter table profiles enable row level security;
alter table suppliers enable row level security;
alter table warehouses enable row level security;
alter table stock_items enable row level security;
alter table stock_batches enable row level security;
alter table stock_movements enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;
alter table order_line_allocations enable row level security;
alter table deliveries enable row level security;
alter table delivery_stops enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;

do $$ begin
  create policy "authenticated read branches" on branches for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read suppliers" on suppliers for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read warehouses" on warehouses for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read stock items" on stock_items for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read stock batches" on stock_batches for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read stock movements" on stock_movements for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read profiles" on profiles for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admin warehouse manage inventory" on stock_batches
    for all to authenticated
    using (current_profile_role() in ('admin', 'warehouse'))
    with check (current_profile_role() in ('admin', 'warehouse'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admin manage stock prices" on stock_items
    for update to authenticated
    using (current_profile_role() = 'admin')
    with check (current_profile_role() = 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated manage orders" on orders
    for all to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated manage order lines" on order_lines
    for all to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated manage allocations" on order_line_allocations
    for all to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated manage deliveries" on deliveries
    for all to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated manage delivery stops" on delivery_stops
    for all to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated manage invoices" on invoices
    for all to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "finance admin manage payments" on payments
    for all to authenticated
    using (current_profile_role() in ('admin', 'finance'))
    with check (current_profile_role() in ('admin', 'finance'));
exception when duplicate_object then null; end $$;

insert into warehouses (name, address)
values ('Main Warehouse', 'Tonino central storage')
on conflict do nothing;

insert into suppliers (name, contact_name, phone, email, lead_time_days)
values
  ('Nutella Lebanon', 'Placeholder', '+961 70 000 000', 'orders@example.com', 5),
  ('Fresh Fruits Co.', 'Placeholder', '+961 70 000 000', 'fresh@example.com', 1),
  ('PackPro Supplies', 'Placeholder', '+961 70 000 000', 'packaging@example.com', 3),
  ('Beverage Distributors', 'Placeholder', '+961 70 000 000', 'beverage@example.com', 2)
on conflict (name) do nothing;

insert into branches (name, slug, address, city, phone, is_franchise, supplies_free)
values
  ('Tonino Aley', 'aley', 'Aley branch', 'Aley', '+961 70 000 000', true, false),
  ('Tonino Ashrafieh', 'ashrafieh', 'Ashrafieh branch', 'Ashrafieh', '+961 70 000 000', true, false),
  ('Tonino Baalbak', 'baalbak', 'Baalbak branch', 'Baalbak', '+961 70 000 000', true, false),
  ('Tonino Batroun', 'batroun', 'Batroun branch', 'Batroun', '+961 70 000 000', true, false),
  ('Tonino Betchay', 'betchay', 'Betchay branch', 'Betchay', '+961 70 000 000', true, false),
  ('Tonino Bent Jbeil', 'bent-jbeil', 'Bent Jbeil branch', 'Bent Jbeil', '+961 70 000 000', true, false),
  ('Tonino Bikfaya', 'bikfaya', 'Bikfaya branch', 'Bikfaya', '+961 70 000 000', true, false),
  ('Tonino Bliss', 'bliss', 'Bliss branch', 'Bliss', '+961 70 000 000', false, true),
  ('Tonino Broumana', 'broumana', 'Broumana branch', 'Broumana', '+961 70 000 000', false, true),
  ('Tonino Chtoura', 'chtoura', 'Chtoura branch', 'Chtoura', '+961 70 000 000', true, false),
  ('Tonino Cola', 'cola', 'Cola branch', 'Cola', '+961 70 000 000', true, false),
  ('Tonino Dahye', 'dahye', 'Dahye branch', 'Dahye', '+961 70 000 000', true, false),
  ('Tonino Sin el Fil', 'sin-el-fil', 'Sin el Fil branch', 'Sin el Fil', '+961 70 000 000', true, false),
  ('Tonino Dhour Chweir', 'dhour-chweir', 'Dhour Chweir branch', 'Dhour Chweir', '+961 70 000 000', true, false),
  ('Tonino Furn el Chebbak', 'furn-el-chebbak', 'Furn el Chebbak branch', 'Furn el Chebbak', '+961 70 000 000', true, false),
  ('Tonino Jal Dib', 'jal-dib', 'Jal Dib branch', 'Jal Dib', '+961 70 000 000', true, false),
  ('Tonino Jbeil', 'jbeil', 'Jbeil branch', 'Jbeil', '+961 70 000 000', true, false),
  ('Tonino Kaslik', 'kaslik', 'Kaslik branch', 'Kaslik', '+961 70 000 000', true, false),
  ('Tonino Khaldeh', 'khaldeh', 'Khaldeh branch', 'Khaldeh', '+961 70 000 000', true, false),
  ('Tonino Mansourieh', 'mansourieh', 'Mansourieh branch', 'Mansourieh', '+961 70 000 000', true, false),
  ('Tonino Mazraat Yachouh', 'mazraat-yachouh', 'Mazraat Yachouh branch', 'Mazraat Yachouh', '+961 70 000 000', true, false),
  ('Tonino Nabatieh', 'nabatieh', 'Nabatieh branch', 'Nabatieh', '+961 70 000 000', true, false),
  ('Tonino Rayfoun', 'rayfoun', 'Rayfoun branch', 'Rayfoun', '+961 70 000 000', true, false),
  ('Tonino Saida', 'saida', 'Saida branch', 'Saida', '+961 70 000 000', true, false),
  ('Tonino Sour', 'sour', 'Sour branch', 'Sour', '+961 70 000 000', true, false),
  ('Tonino Sour Chabriha Rd', 'sour-chabriha-rd', 'Sour Chabriha Rd branch', 'Sour Chabriha Rd', '+961 70 000 000', true, false),
  ('Tonino Zahle', 'zahle', 'Zahle branch', 'Zahle', '+961 70 000 000', true, false),
  ('Tonino Zgharta', 'zgharta', 'Zgharta branch', 'Zgharta', '+961 70 000 000', true, false),
  ('Tonino Zouk Mosbeh', 'zouk-mosbeh', 'Zouk Mosbeh branch', 'Zouk Mosbeh', '+961 70 000 000', true, false),
  ('Tonino Qartaba', 'qartaba', 'Qartaba branch', 'Qartaba', '+961 70 000 000', true, false),
  ('Tonino City Mall', 'city-mall', 'City Mall branch', 'City Mall', '+961 70 000 000', false, true),
  ('Tonino Kfardebian', 'kfardebian', 'Kfardebian branch', 'Kfardebian', '+961 70 000 000', true, false)
on conflict (slug) do nothing;

with supplier_map as (
  select id, name from suppliers
)
insert into stock_items (legacy_code, name, category, unit, price, requires_expiry, average_order_qty, supplier_id)
values
  ('stock-1', 'Nutella Spread', 'Chocolate & spreads', 'bucket', 81, true, 5, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-2', 'White Spread', 'Chocolate & spreads', 'bucket', 26, true, 5, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-3', 'Lotus Spread', 'Chocolate & spreads', 'bucket', 70, true, 5, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-4', 'Pistachio Spread', 'Chocolate & spreads', 'bucket', 70, true, 4, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-5', 'Dark Chocolate Spread', 'Chocolate & spreads', 'bucket', 36, true, 5, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-6', 'Hazelnuts Chocolate Spread', 'Chocolate & spreads', 'bucket', 32, true, 5, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-7', 'Peanut Butter Spread', 'Chocolate & spreads', 'piece', 4.5, true, 6, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-8', 'Kinder Chocolate', 'Chocolate & spreads', 'box', 125, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-9', 'Crepe Dough Mix', 'Dough & bases', 'kg', 4.75, true, 12, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-10', 'Waffle Dough Mix', 'Dough & bases', 'kg', 4.9, true, 10, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-11', 'Crepe Plate', 'Packaging', 'pack', 12.5, false, 10, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-12', 'Crepe Cover', 'Packaging', 'pack', 15.5, false, 10, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-13', 'Waffle Plate', 'Packaging', 'pack', 8, false, 8, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-14', 'Waffle Cover', 'Packaging', 'pack', 7, false, 8, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-15', 'Bowls', 'Packaging', 'pack / 50 pieces', 21.5, false, 8, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-16', 'Hazelnuts Syrup', 'Add-ons', 'bottle', 8, true, 4, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-17', 'White Syrup', 'Add-ons', 'bottle', 7, true, 4, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-18', 'Lotus Syrup', 'Add-ons', 'bottle', 8, true, 4, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-19', 'Pistachio Syrup', 'Add-ons', 'bottle', 15, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-20', 'Caramel Syrup', 'Add-ons', 'bottle', 8, true, 4, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-21', 'Strawberry Syrup', 'Add-ons', 'bottle', 8, true, 4, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-22', 'Mapel Syrup', 'Add-ons', 'bottle', 10, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-23', 'Forks', 'Packaging', 'pack / 100 pieces', 2.2, false, 10, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-24', 'Knives', 'Packaging', 'pack / 100 pieces', 2.2, false, 10, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-25', 'Spoons', 'Packaging', 'pack / 100 pieces', 2.2, false, 10, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-26', 'Plastic Bag', 'Packaging', 'kg', 3.5, false, 6, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-27', 'Cartoon Bag', 'Packaging', 'box / 300 pieces', 80, false, 2, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-28', 'Napkins', 'Packaging', 'pack', 12, false, 8, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-29', 'Wet Napkins', 'Packaging', 'pack', 10, false, 6, (select id from supplier_map where name = 'PackPro Supplies')),
  ('stock-30', 'Brownies Crumble', 'Add-ons', 'kg', 12, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-31', 'Cookies Vanilla Crumble', 'Add-ons', 'kg', 12, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-32', 'Cookies Chocolate Crumble', 'Add-ons', 'kg', 12, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-33', 'Lotus Crumble', 'Add-ons', 'kg', 14, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-34', 'Oreo Crumble', 'Add-ons', 'kg', 14, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-35', 'Knefe', 'Add-ons', 'piece', 2.5, true, 8, (select id from supplier_map where name = 'Fresh Fruits Co.')),
  ('stock-36', 'Osmaliye', 'Add-ons', 'kg', 9, true, 3, (select id from supplier_map where name = 'Fresh Fruits Co.')),
  ('stock-37', 'Nuts', 'Add-ons', 'kg', 6, true, 4, (select id from supplier_map where name = 'Fresh Fruits Co.')),
  ('stock-38', 'Chocolate Chips', 'Add-ons', 'kg', 8, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-39', 'Oreo Biscuits', 'Add-ons', 'box', 0, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-40', 'Digestive Biscuits', 'Add-ons', 'box', 0, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-41', 'Smarties', 'Add-ons', 'kg', 13, true, 3, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-42', 'Marshmallow', 'Add-ons', 'bag', 2, true, 4, (select id from supplier_map where name = 'Nutella Lebanon')),
  ('stock-43', 'Mozzarella Cheese', 'Savory ingredients', 'pack / 2kg', 14, true, 5, (select id from supplier_map where name = 'Fresh Fruits Co.')),
  ('stock-44', 'Mixed Cheese', 'Savory ingredients', 'pack / 2kg', 18, true, 5, (select id from supplier_map where name = 'Fresh Fruits Co.')),
  ('stock-45', 'Turkey', 'Savory ingredients', 'kg', 12, true, 4, (select id from supplier_map where name = 'Fresh Fruits Co.')),
  ('stock-46', 'Receipt Rolls', 'Cleaning & disposables', 'piece', 1, false, 6, (select id from supplier_map where name = 'PackPro Supplies'))
on conflict (legacy_code) do update
set name = excluded.name,
    category = excluded.category,
    unit = excluded.unit,
    price = excluded.price,
    requires_expiry = excluded.requires_expiry,
    average_order_qty = excluded.average_order_qty,
    supplier_id = excluded.supplier_id,
    updated_at = now();
