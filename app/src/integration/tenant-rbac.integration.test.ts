import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SQL } from "bun";
import { sign } from "hono/jwt";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const maybeDescribe: typeof describe = databaseUrl
  ? describe
  : ((name: string) => describe(name, () => {
    test.skip("requires DATABASE_URL or POSTGRES_URL", () => {});
  })) as unknown as typeof describe;

const tenants = {
  a: "00000000-0000-0000-0000-000000000201",
  b: "00000000-0000-0000-0000-000000000202",
};

const users = {
  administrator: "00000000-0000-0000-0000-000000000211",
  manager: "00000000-0000-0000-0000-000000000212",
  serviceAdvisor: "00000000-0000-0000-0000-000000000213",
  mechanic: "00000000-0000-0000-0000-000000000214",
  tenantBAdministrator: "00000000-0000-0000-0000-000000000215",
};

const rows = {
  customerA: "00000000-0000-0000-0000-000000000221",
  customerB: "00000000-0000-0000-0000-000000000222",
  vehicleA: "00000000-0000-0000-0000-000000000231",
  vehicleB: "00000000-0000-0000-0000-000000000232",
  mechanicA: "00000000-0000-0000-0000-000000000241",
  mechanicB: "00000000-0000-0000-0000-000000000242",
  partA: "00000000-0000-0000-0000-000000000251",
  partB: "00000000-0000-0000-0000-000000000252",
  workOrderA: "00000000-0000-0000-0000-000000000261",
  workOrderB: "00000000-0000-0000-0000-000000000262",
  invoiceA: "00000000-0000-0000-0000-000000000271",
};

let sql: SQL;
let fetchApi: (request: Request) => Response | Promise<Response>;
let jwtSecret: () => string;

maybeDescribe("PostgreSQL tenant isolation and RBAC", () => {
  beforeAll(async () => {
    sql = new SQL(databaseUrl);
    const appModule = await import("../index");
    const httpModule = await import("../http");
    fetchApi = appModule.default.fetch;
    jwtSecret = httpModule.jwtSecret;
    await resetFixtures();
    await seedFixtures();
  });

  afterAll(async () => {
    if (!sql) return;
    await resetFixtures();
    await sql.close();
  });

  test("RLS hides tenant-owned rows for other tenants", async () => {
    await setTenant(tenants.a);
    const tenantACustomers = await sql`select id, name from customers where id = ${rows.customerA}`;
    const tenantBCustomersFromA = await sql`select id, name from customers where id = ${rows.customerB}`;
    const tenantAParts = await sql`select id, name from parts where id = ${rows.partA}`;
    const tenantBPartsFromA = await sql`select id, name from parts where id = ${rows.partB}`;
    const tenantAWorkOrders = await sql`select id, status from work_orders where id = ${rows.workOrderA}`;
    const tenantBWorkOrdersFromA = await sql`select id, status from work_orders where id = ${rows.workOrderB}`;

    expect(tenantACustomers).toHaveLength(1);
    expect(tenantBCustomersFromA).toHaveLength(0);
    expect(tenantAParts).toHaveLength(1);
    expect(tenantBPartsFromA).toHaveLength(0);
    expect(tenantAWorkOrders).toHaveLength(1);
    expect(tenantBWorkOrdersFromA).toHaveLength(0);
  });

  test("RLS rejects inserts whose tenant id does not match app.current_tenant", async () => {
    await setTenant(tenants.a);

    await expect(sql`
      insert into parts (tenant_id, number, name, compatibility, quantity, min_quantity, unit_price)
      values (${tenants.b}, 'IT-RLS-BAD', 'RLS mismatch', '', 1, 0, 100)
    `).rejects.toThrow();
  });

  test("API list endpoints return only the authenticated tenant rows", async () => {
    const token = await tokenFor(users.administrator, tenants.a, "administrator");

    const customers = await apiJson("/api/customers", token);
    const parts = await apiJson("/api/parts", token);
    const workOrders = await apiJson("/api/work-orders", token);

    expect(customers.customers.map((row: any) => row.id)).toContain(rows.customerA);
    expect(customers.customers.map((row: any) => row.id)).not.toContain(rows.customerB);
    expect(parts.parts.map((row: any) => row.id)).toContain(rows.partA);
    expect(parts.parts.map((row: any) => row.id)).not.toContain(rows.partB);
    expect(workOrders.workOrders.map((row: any) => row.id)).toContain(rows.workOrderA);
    expect(workOrders.workOrders.map((row: any) => row.id)).not.toContain(rows.workOrderB);
  });

  test("API mutations cannot target another tenant resource", async () => {
    const tenantBToken = await tokenFor(users.tenantBAdministrator, tenants.b, "administrator");

    const workOrderResponse = await api("/api/work-orders/" + rows.workOrderA + "/advance", tenantBToken, {
      method: "PATCH",
    });
    const partResponse = await api("/api/parts/" + rows.partA + "/adjustments", tenantBToken, {
      method: "POST",
      body: { quantityDelta: 1, reason: "correction", memo: "cross tenant check" },
    });

    expect(workOrderResponse.status).toBe(404);
    expect(partResponse.status).toBe(404);
  });

  test("administrator and service advisor can create operational records", async () => {
    const administratorToken = await tokenFor(users.administrator, tenants.a, "administrator");
    const serviceAdvisorToken = await tokenFor(users.serviceAdvisor, tenants.a, "service_advisor");

    const customerResponse = await api("/api/customers", administratorToken, {
      method: "POST",
      body: {
        name: "Integration Created Customer",
        phone: "090-0201-0001",
        email: "created@example.jp",
        address: "Tokyo",
        vehicle: {
          make: "Toyota",
          model: "Aqua",
          year: 2021,
          registrationNumber: "IT-API-201",
          vin: "ITVIN201",
          mileage: 12000,
          inspectionExpiresAt: "2026-12-31",
        },
      },
    });
    const partResponse = await api("/api/parts", serviceAdvisorToken, {
      method: "POST",
      body: {
        number: "IT-API-PART-201",
        name: "Integration Test Part",
        compatibility: "Toyota",
        quantity: 3,
        minQuantity: 1,
        unitPrice: 1200,
      },
    });
    const reservationResponse = await api("/api/reservations", serviceAdvisorToken, {
      method: "POST",
      body: {
        customerId: rows.customerA,
        vehicleId: rows.vehicleA,
        mechanicId: rows.mechanicA,
        serviceType: "点検",
        startsAt: "2027-01-01T10:00:00.000Z",
        loanerRequested: false,
      },
    });

    expect(customerResponse.status).toBe(201);
    expect(partResponse.status).toBe(201);
    expect(reservationResponse.status).toBe(201);
  });

  test("mechanic can advance work orders but cannot create customers, parts, or reservations", async () => {
    const mechanicToken = await tokenFor(users.mechanic, tenants.a, "mechanic");

    const advanceResponse = await api("/api/work-orders/" + rows.workOrderA + "/advance", mechanicToken, {
      method: "PATCH",
    });
    const customerResponse = await api("/api/customers", mechanicToken, {
      method: "POST",
      body: {
        name: "Mechanic Forbidden",
        phone: "090-0201-0002",
        vehicle: {
          make: "Toyota",
          model: "Aqua",
          year: 2021,
          registrationNumber: "IT-FORBIDDEN-MECH",
          inspectionExpiresAt: "2026-12-31",
        },
      },
    });
    const partResponse = await api("/api/parts", mechanicToken, {
      method: "POST",
      body: {
        number: "IT-FORBIDDEN-MECH",
        name: "Forbidden Part",
        compatibility: "",
        quantity: 1,
        minQuantity: 1,
        unitPrice: 100,
      },
    });
    const reservationResponse = await api("/api/reservations", mechanicToken, {
      method: "POST",
      body: {
        customerId: rows.customerA,
        vehicleId: rows.vehicleA,
        mechanicId: rows.mechanicA,
        serviceType: "点検",
        startsAt: "2027-01-02T10:00:00.000Z",
      },
    });

    expect(advanceResponse.status).toBe(200);
    expect(customerResponse.status).toBe(403);
    expect(partResponse.status).toBe(403);
    expect(reservationResponse.status).toBe(403);
  });

  test("manager can read dashboards and lists but cannot mutate operational data", async () => {
    const managerToken = await tokenFor(users.manager, tenants.a, "manager");

    const dashboardResponse = await api("/api/bootstrap", managerToken);
    const invoiceResponse = await api("/api/invoices", managerToken);
    const partsResponse = await api("/api/parts", managerToken);
    const createPartResponse = await api("/api/parts", managerToken, {
      method: "POST",
      body: {
        number: "IT-FORBIDDEN-MANAGER",
        name: "Manager Forbidden Part",
        compatibility: "",
        quantity: 1,
        minQuantity: 1,
        unitPrice: 100,
      },
    });

    expect(dashboardResponse.status).toBe(200);
    expect(invoiceResponse.status).toBe(200);
    expect(partsResponse.status).toBe(200);
    expect(createPartResponse.status).toBe(403);
  });
});

async function apiJson(path: string, token: string) {
  const response = await api(path, token);
  expect(response.status).toBe(200);
  return response.json();
}

function api(path: string, token: string, options: { method?: string; body?: unknown } = {}) {
  return Promise.resolve(fetchApi(new Request("http://localhost" + path, {
    method: options.method || "GET",
    headers: {
      authorization: "Bearer " + token,
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })));
}

function tokenFor(userId: string, tenantId: string, role: string) {
  return sign({
    sub: userId,
    tenantId,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  }, jwtSecret());
}

async function resetFixtures() {
  for (const tenantId of Object.values(tenants)) {
    await setTenant(tenantId);
    await sql`delete from invoices where tenant_id = ${tenantId}`;
    await sql`delete from estimates where tenant_id = ${tenantId}`;
    await sql`delete from work_orders where tenant_id = ${tenantId}`;
    await sql`delete from reservations where tenant_id = ${tenantId}`;
    await sql`delete from part_adjustments where tenant_id = ${tenantId}`;
    await sql`delete from purchase_orders where tenant_id = ${tenantId}`;
    await sql`delete from parts where tenant_id = ${tenantId}`;
    await sql`delete from mechanics where tenant_id = ${tenantId}`;
    await sql`delete from vehicles where tenant_id = ${tenantId}`;
    await sql`delete from customers where tenant_id = ${tenantId}`;
  }

  await sql`
    delete from auth_audit_logs
    where email like 'it-%@example.jp'
      or tenant_id in (${tenants.a}, ${tenants.b})
      or user_id in (
        ${users.administrator},
        ${users.manager},
        ${users.serviceAdvisor},
        ${users.mechanic},
        ${users.tenantBAdministrator}
      )
  `;
  await sql`
    delete from tenant_memberships
    where tenant_id in (${tenants.a}, ${tenants.b})
      or user_id in (
        ${users.administrator},
        ${users.manager},
        ${users.serviceAdvisor},
        ${users.mechanic},
        ${users.tenantBAdministrator}
      )
  `;
  await sql`
    delete from users
    where id in (
      ${users.administrator},
      ${users.manager},
      ${users.serviceAdvisor},
      ${users.mechanic},
      ${users.tenantBAdministrator}
    )
  `;
  await sql`delete from tenants where id in (${tenants.a}, ${tenants.b})`;
}

async function seedFixtures() {
  await sql`
    insert into tenants (id, slug, name, reminder_days)
    values
      (${tenants.a}, 'integration-a', 'Integration Tenant A', 60),
      (${tenants.b}, 'integration-b', 'Integration Tenant B', 60)
  `;
  await sql`
    insert into users (id, email, name, password_hash)
    values
      (${users.administrator}, 'it-admin@example.jp', 'Integration Administrator', 'unused'),
      (${users.manager}, 'it-manager@example.jp', 'Integration Manager', 'unused'),
      (${users.serviceAdvisor}, 'it-advisor@example.jp', 'Integration Advisor', 'unused'),
      (${users.mechanic}, 'it-mechanic@example.jp', 'Integration Mechanic', 'unused'),
      (${users.tenantBAdministrator}, 'it-admin-b@example.jp', 'Integration Tenant B Administrator', 'unused')
  `;
  await sql`
    insert into tenant_memberships (tenant_id, user_id, role)
    values
      (${tenants.a}, ${users.administrator}, 'administrator'),
      (${tenants.a}, ${users.manager}, 'manager'),
      (${tenants.a}, ${users.serviceAdvisor}, 'service_advisor'),
      (${tenants.a}, ${users.mechanic}, 'mechanic'),
      (${tenants.b}, ${users.tenantBAdministrator}, 'administrator')
  `;

  await seedTenantRows(tenants.a, {
    customer: rows.customerA,
    vehicle: rows.vehicleA,
    mechanic: rows.mechanicA,
    part: rows.partA,
    workOrder: rows.workOrderA,
    invoice: rows.invoiceA,
    name: "Tenant A",
  });
  await seedTenantRows(tenants.b, {
    customer: rows.customerB,
    vehicle: rows.vehicleB,
    mechanic: rows.mechanicB,
    part: rows.partB,
    workOrder: rows.workOrderB,
    name: "Tenant B",
  });
}

async function seedTenantRows(tenantId: string, input: {
  customer: string;
  vehicle: string;
  mechanic: string;
  part: string;
  workOrder: string;
  invoice?: string;
  name: string;
}) {
  await setTenant(tenantId);
  await sql`
    insert into customers (id, tenant_id, name, phone, email, address)
    values (${input.customer}, ${tenantId}, ${input.name + " Customer"}, '090-0000-0000', '', '')
  `;
  await sql`
    insert into vehicles (
      id,
      tenant_id,
      customer_id,
      make,
      model,
      year,
      registration_number,
      vin,
      mileage,
      inspection_expires_at,
      insurance_expires_at
    )
    values (
      ${input.vehicle},
      ${tenantId},
      ${input.customer},
      'Toyota',
      'Prius',
      2020,
      ${"IT-" + input.name.replace(" ", "-")},
      ${"VIN-" + input.name.replace(" ", "-")},
      10000,
      '2026-12-31',
      '2026-12-31'
    )
  `;
  await sql`
    insert into mechanics (id, tenant_id, name, skills)
    values (${input.mechanic}, ${tenantId}, ${input.name + " Mechanic"}, array['点検'])
  `;
  await sql`
    insert into parts (id, tenant_id, number, name, compatibility, quantity, min_quantity, unit_price)
    values (${input.part}, ${tenantId}, ${"IT-PART-" + input.name.replace(" ", "-")}, ${input.name + " Part"}, '', 5, 1, 1000)
  `;
  await sql`
    insert into work_orders (
      id,
      tenant_id,
      customer_id,
      vehicle_id,
      mechanic_ids,
      service_type,
      status,
      estimated_hours,
      status_history,
      checklist
    )
    values (
      ${input.workOrder},
      ${tenantId},
      ${input.customer},
      ${input.vehicle},
      array[${input.mechanic}::uuid],
      '点検',
      '予約済み',
      1.5,
      '[]'::jsonb,
      '[]'::jsonb
    )
  `;

  if (input.invoice) {
    const estimateId = "00000000-0000-0000-0000-000000000272";
    await sql`
      insert into estimates (
        id,
        tenant_id,
        work_order_id,
        status,
        symptoms,
        confidence,
        subtotal,
        tax,
        total
      )
      values (${estimateId}, ${tenantId}, ${input.workOrder}, 'finalized', 'integration test', 0.5, 1000, 100, 1100)
    `;
    await sql`
      insert into invoices (id, tenant_id, number, estimate_id, work_order_id, subtotal, tax, total)
      values (${input.invoice}, ${tenantId}, 'IT-INV-201', ${estimateId}, ${input.workOrder}, 1000, 100, 1100)
    `;
  }
}

async function setTenant(tenantId: string) {
  await sql`select set_config('app.current_tenant', ${tenantId}, false)`;
}
