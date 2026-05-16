create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  reminder_days integer not null default 60,
  brand_color text not null default '#0f766e',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('administrator', 'manager', 'service_advisor', 'mechanic')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists auth_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  email text not null default '',
  event text not null,
  ip_address text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null default '',
  address text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null,
  registration_number text not null,
  vin text not null default '',
  mileage integer not null default 0,
  inspection_expires_at date not null,
  insurance_expires_at date not null,
  last_reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, registration_number)
);

create table if not exists mechanics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  skills text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  mechanic_id uuid not null references mechanics(id),
  service_type text not null,
  starts_at timestamptz not null,
  loaner_requested boolean not null default false,
  notes text not null default '',
  status text not null default '予約済み',
  created_at timestamptz not null default now()
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  reservation_id uuid references reservations(id) on delete set null,
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  mechanic_ids uuid[] not null default '{}',
  service_type text not null,
  status text not null default '予約済み',
  estimated_hours numeric(6,2) not null default 0,
  actual_minutes integer not null default 0,
  status_history jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists parts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  number text not null,
  name text not null,
  compatibility text not null default '',
  quantity integer not null default 0,
  min_quantity integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create table if not exists part_adjustments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  part_id uuid not null references parts(id) on delete cascade,
  quantity_delta integer not null,
  reason text not null,
  memo text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  supplier_name text not null,
  status text not null default 'draft',
  expected_delivery_at date,
  line_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  work_order_id uuid not null references work_orders(id) on delete cascade,
  status text not null default 'draft',
  symptoms text not null,
  error_codes text not null default '',
  confidence numeric(4,3) not null default 0,
  candidates jsonb not null default '[]'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null,
  tax numeric(12,2) not null,
  total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  number text not null,
  estimate_id uuid not null references estimates(id),
  work_order_id uuid not null references work_orders(id),
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null,
  tax numeric(12,2) not null,
  total numeric(12,2) not null,
  paid numeric(12,2) not null default 0,
  status text not null default 'unpaid',
  payments jsonb not null default '[]'::jsonb,
  issued_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create index if not exists idx_customers_tenant_name on customers (tenant_id, name);
create index if not exists idx_tenant_memberships_user on tenant_memberships (user_id, tenant_id);
create index if not exists idx_auth_audit_logs_user on auth_audit_logs (user_id, created_at);
create index if not exists idx_vehicles_tenant_registration on vehicles (tenant_id, registration_number);
create index if not exists idx_reservations_tenant_starts on reservations (tenant_id, starts_at);
create index if not exists idx_work_orders_tenant_status on work_orders (tenant_id, status);
create index if not exists idx_parts_tenant_stock on parts (tenant_id, quantity, min_quantity);
create index if not exists idx_part_adjustments_tenant_part on part_adjustments (tenant_id, part_id, created_at);
create index if not exists idx_purchase_orders_tenant_status on purchase_orders (tenant_id, status, created_at);

alter table customers enable row level security;
alter table tenant_memberships disable row level security;
alter table auth_audit_logs disable row level security;
alter table vehicles enable row level security;
alter table mechanics enable row level security;
alter table reservations enable row level security;
alter table work_orders enable row level security;
alter table parts enable row level security;
alter table part_adjustments enable row level security;
alter table purchase_orders enable row level security;
alter table estimates enable row level security;
alter table invoices enable row level security;

alter table customers force row level security;
alter table vehicles force row level security;
alter table mechanics force row level security;
alter table reservations force row level security;
alter table work_orders force row level security;
alter table parts force row level security;
alter table part_adjustments force row level security;
alter table purchase_orders force row level security;
alter table estimates force row level security;
alter table invoices force row level security;

drop policy if exists tenant_isolation_customers on customers;
create policy tenant_isolation_customers on customers
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_tenant_memberships on tenant_memberships;
drop policy if exists tenant_isolation_auth_audit_logs on auth_audit_logs;

drop policy if exists tenant_isolation_vehicles on vehicles;
create policy tenant_isolation_vehicles on vehicles
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_mechanics on mechanics;
create policy tenant_isolation_mechanics on mechanics
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_reservations on reservations;
create policy tenant_isolation_reservations on reservations
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_work_orders on work_orders;
create policy tenant_isolation_work_orders on work_orders
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_parts on parts;
create policy tenant_isolation_parts on parts
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_part_adjustments on part_adjustments;
create policy tenant_isolation_part_adjustments on part_adjustments
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_purchase_orders on purchase_orders;
create policy tenant_isolation_purchase_orders on purchase_orders
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_estimates on estimates;
create policy tenant_isolation_estimates on estimates
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_invoices on invoices;
create policy tenant_isolation_invoices on invoices
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);
