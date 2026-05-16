insert into tenants (id, slug, name, reminder_days)
values ('00000000-0000-0000-0000-000000000001', 'demo', '田中モータース', 60)
on conflict (id) do nothing;

select set_config('app.current_tenant', '00000000-0000-0000-0000-000000000001', false);

insert into users (id, email, name, password_hash)
values (
  '55555555-5555-4555-8555-555555555551',
  'admin@example.jp',
  'デモ管理者',
  '$2b$10$S8AgpYoJc1QizeRRXmBKOeBjsdGtjlAIj5HyTBHZQ1Mm0sm63b0F2'
)
on conflict (id) do nothing;

insert into tenant_memberships (id, tenant_id, user_id, role)
values (
  '66666666-6666-4666-8666-666666666661',
  '00000000-0000-0000-0000-000000000001',
  '55555555-5555-4555-8555-555555555551',
  'administrator'
)
on conflict (id) do nothing;

insert into customers (id, tenant_id, name, phone, email, address)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000001', '佐藤 一郎', '090-1111-2222', 'sato@example.jp', '東京都品川区'),
  ('11111111-1111-4111-8111-111111111112', '00000000-0000-0000-0000-000000000001', '鈴木 花子', '080-3333-4444', 'suzuki@example.jp', '神奈川県川崎市')
on conflict (id) do nothing;

insert into vehicles (id, tenant_id, customer_id, make, model, year, registration_number, vin, mileage, inspection_expires_at, insurance_expires_at)
values
  ('22222222-2222-4222-8222-222222222221', '00000000-0000-0000-0000-000000000001', '11111111-1111-4111-8111-111111111111', 'Toyota', 'Prius', 2018, '品川 330 あ 12-34', 'ZVW500001', 58200, current_date + interval '42 days', current_date + interval '120 days'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000001', '11111111-1111-4111-8111-111111111112', 'Nissan', 'Leaf', 2020, '川崎 500 い 56-78', 'ZE100002', 32100, current_date + interval '88 days', current_date + interval '130 days')
on conflict (id) do nothing;

insert into mechanics (id, tenant_id, name, skills)
values
  ('33333333-3333-4333-8333-333333333331', '00000000-0000-0000-0000-000000000001', '高橋', array['車検', 'EV']),
  ('33333333-3333-4333-8333-333333333332', '00000000-0000-0000-0000-000000000001', '山本', array['修理', '板金'])
on conflict (id) do nothing;

insert into parts (id, tenant_id, number, name, compatibility, quantity, min_quantity, unit_price)
values
  ('44444444-4444-4444-8444-444444444441', '00000000-0000-0000-0000-000000000001', 'BRK-PD-001', 'ブレーキパッド', 'Toyota Prius', 4, 3, 9800),
  ('44444444-4444-4444-8444-444444444442', '00000000-0000-0000-0000-000000000001', 'BAT-EV-044', 'バッテリー', 'Nissan Leaf', 1, 2, 27800),
  ('44444444-4444-4444-8444-444444444443', '00000000-0000-0000-0000-000000000001', 'O2S-778', 'O2センサー', 'Toyota / Nissan', 2, 2, 14500)
on conflict (id) do nothing;
