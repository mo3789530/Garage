begin;

insert into tenants (id, slug, name)
values
  ('00000000-0000-0000-0000-000000000101', 'rls-a', 'RLS A'),
  ('00000000-0000-0000-0000-000000000102', 'rls-b', 'RLS B')
on conflict (id) do nothing;

select set_config('app.current_tenant', '00000000-0000-0000-0000-000000000101', true);

insert into customers (tenant_id, name, phone, email, address)
values ('00000000-0000-0000-0000-000000000101', 'Tenant A Customer', '000', '', '');

select set_config('app.current_tenant', '00000000-0000-0000-0000-000000000102', true);

do $$
begin
  if exists (select 1 from customers where name = 'Tenant A Customer') then
    raise exception 'RLS isolation failed: tenant B can read tenant A customer';
  end if;
end $$;

rollback;
