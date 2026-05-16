import { Hono } from "hono";
import { eq, ilike, or } from "drizzle-orm";
import { requireRole, type ApiEnv } from "../../http";
import { withTenant } from "../../db/client";
import { customers, vehicles } from "../../db/schema";
import { parseJson } from "../../errors";
import { createCustomerSchema } from "./validators";

export const customerRoutes = new Hono<ApiEnv>();

customerRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const query = c.req.query("q") || "";
  const rows = await withTenant(tenantId, async (tx) => {
    if (!query) {
      return tx.select().from(customers).where(eq(customers.tenantId, tenantId)).orderBy(customers.name);
    }
    const q = `%${query}%`;
    return tx
      .selectDistinct({
        id: customers.id,
        tenantId: customers.tenantId,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .leftJoin(vehicles, eq(vehicles.customerId, customers.id))
      .where(or(ilike(customers.name, q), ilike(customers.phone, q), ilike(customers.email, q), ilike(vehicles.registrationNumber, q)))
      .orderBy(customers.name);
  });
  return c.json({ customers: rows });
});

customerRoutes.post("/", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const input = await parseJson(c.req.raw, createCustomerSchema);
  const result = await withTenant(tenantId, async (tx) => {
    const [customer] = await tx.insert(customers).values({
      tenantId,
      name: input.name,
      phone: input.phone,
      email: input.email || "",
      address: input.address || "",
    }).returning();
    const [vehicle] = await tx.insert(vehicles).values({
      tenantId,
      customerId: customer.id,
      make: input.vehicle.make,
      model: input.vehicle.model,
      year: Number(input.vehicle.year),
      registrationNumber: input.vehicle.registrationNumber,
      vin: input.vehicle.vin || "",
      mileage: Number(input.vehicle.mileage || 0),
      inspectionExpiresAt: input.vehicle.inspectionExpiresAt,
      insuranceExpiresAt: input.vehicle.insuranceExpiresAt || input.vehicle.inspectionExpiresAt,
    }).returning();
    return { customer, vehicle };
  });
  return c.json(result, 201);
});
