import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { withTenant } from "../../db/client";
import { partAdjustments, parts, purchaseOrders } from "../../db/schema";
import { conflict, notFound, parseJson } from "../../errors";
import { requireRole, type ApiEnv } from "../../http";
import { adjustPartSchema, createPartSchema, createPurchaseOrderSchema } from "./validators";

export const partRoutes = new Hono<ApiEnv>();

partRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await withTenant(tenantId, (tx) =>
    tx.select().from(parts).where(eq(parts.tenantId, tenantId)).orderBy(parts.name),
  );
  return c.json({ parts: rows });
});

partRoutes.post("/", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const input = await parseJson(c.req.raw, createPartSchema);
  const [part] = await withTenant(tenantId, (tx) =>
    tx.insert(parts).values({
      tenantId,
      number: input.number,
      name: input.name,
      compatibility: input.compatibility,
      quantity: input.quantity,
      minQuantity: input.minQuantity,
      unitPrice: String(input.unitPrice),
    }).returning(),
  );
  return c.json({ part }, 201);
});

partRoutes.post("/:id/adjustments", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const partId = c.req.param("id");
  const input = await parseJson(c.req.raw, adjustPartSchema);
  const result = await withTenant(tenantId, async (tx) => {
    const [current] = await tx.select().from(parts).where(and(eq(parts.tenantId, tenantId), eq(parts.id, partId)));
    if (!current) throw notFound("部品が見つかりません");
    if (current.quantity + input.quantityDelta < 0) throw conflict("在庫数がマイナスになる調整はできません");

    const [adjustment] = await tx.insert(partAdjustments).values({
      tenantId,
      partId,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      memo: input.memo,
    }).returning();
    const [part] = await tx.update(parts).set({
      quantity: sql`${parts.quantity} + ${input.quantityDelta}`,
    }).where(eq(parts.id, partId)).returning();
    return { part, adjustment };
  });
  return c.json(result, 201);
});

partRoutes.post("/purchase-orders", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const input = await parseJson(c.req.raw, createPurchaseOrderSchema);
  const [purchaseOrder] = await withTenant(tenantId, (tx) =>
    tx.insert(purchaseOrders).values({
      tenantId,
      supplierName: input.supplierName,
      expectedDeliveryAt: input.expectedDeliveryAt || null,
      lineItems: input.lineItems,
      status: "draft",
    }).returning(),
  );
  return c.json({ purchaseOrder }, 201);
});

partRoutes.get("/purchase-orders", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await withTenant(tenantId, (tx) =>
    tx.select().from(purchaseOrders).where(eq(purchaseOrders.tenantId, tenantId)).orderBy(desc(purchaseOrders.createdAt)),
  );
  return c.json({ purchaseOrders: rows });
});
