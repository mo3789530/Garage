import { describe, expect, test } from "bun:test";

const schemaSql = await Bun.file("db/schema.sql").text();
const seedSql = await Bun.file("db/seed.sql").text();
const drizzleSchema = await Bun.file("src/db/schema.ts").text();
const baselineMigration = await Bun.file("drizzle/0000_oval_mindworm.sql").text();

const tenantOwnedTables = [
  "customers",
  "vehicles",
  "mechanics",
  "reservations",
  "work_orders",
  "parts",
  "part_adjustments",
  "purchase_orders",
  "estimates",
  "invoices",
];

const requiredIndexes = [
  "idx_customers_tenant_name",
  "idx_tenant_memberships_user",
  "idx_auth_audit_logs_user",
  "idx_vehicles_tenant_registration",
  "idx_reservations_tenant_starts",
  "idx_work_orders_tenant_status",
  "idx_parts_tenant_stock",
  "idx_part_adjustments_tenant_part",
  "idx_purchase_orders_tenant_status",
];

describe("schema alignment", () => {
  test("Drizzle schema declares every raw SQL operational index", () => {
    for (const indexName of requiredIndexes) {
      expect(drizzleSchema).toContain(indexName);
      expect(schemaSql).toContain(`create index if not exists ${indexName}`);
    }
  });

  test("Drizzle and raw SQL both constrain supported membership roles", () => {
    const roles = ["administrator", "manager", "service_advisor", "mechanic"];

    expect(drizzleSchema).toContain("tenant_memberships_role_check");
    expect(schemaSql).toContain("role text not null check");
    for (const role of roles) {
      expect(drizzleSchema).toContain(role);
      expect(schemaSql).toContain(role);
    }
  });

  test("raw SQL enables and forces RLS on all tenant-owned tables", () => {
    for (const table of tenantOwnedTables) {
      expect(schemaSql).toContain(`alter table ${table} enable row level security`);
      expect(schemaSql).toContain(`alter table ${table} force row level security`);
      expect(schemaSql).toContain(`create policy tenant_isolation_${table} on ${table}`);
    }
  });

  test("baseline migration includes extension setup and tenant RLS policies", () => {
    expect(baselineMigration).toContain("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    for (const table of tenantOwnedTables) {
      expect(baselineMigration).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      expect(baselineMigration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      expect(baselineMigration).toContain(`CREATE POLICY "tenant_isolation_${table}" ON "${table}"`);
    }
  });

  test("seed data runs under the demo tenant context", () => {
    expect(seedSql).toContain("00000000-0000-0000-0000-000000000001");
    expect(seedSql).toContain("select set_config('app.current_tenant'");
    expect(seedSql).toContain("'admin@example.jp'");
    expect(seedSql).toContain("'administrator'");
  });
});
