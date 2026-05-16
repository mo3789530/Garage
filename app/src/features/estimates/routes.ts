import { Hono } from "hono";
import { eq, inArray, sql } from "drizzle-orm";
import { requireRole, type ApiEnv } from "../../http";
import { withTenant } from "../../db/client";
import { estimates, invoices, parts, vehicles, workOrders } from "../../db/schema";
import { conflict, notFound, parseJson } from "../../errors";
import { createAiEstimateSchema } from "./validators";

export const estimateRoutes = new Hono<ApiEnv>();

estimateRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await withTenant(tenantId, (tx) =>
    tx.select().from(estimates).where(eq(estimates.tenantId, tenantId)).orderBy(estimates.createdAt),
  );
  return c.json({ estimates: rows });
});

estimateRoutes.post("/ai", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const input = await parseJson(c.req.raw, createAiEstimateSchema);
  const estimate = await withTenant(tenantId, async (tx) => {
    const [workOrder] = await tx
      .select({ id: workOrders.id, serviceType: workOrders.serviceType, make: vehicles.make })
      .from(workOrders)
      .innerJoin(vehicles, eq(vehicles.id, workOrders.vehicleId))
      .where(eq(workOrders.id, input.workOrderId));
    if (!workOrder) throw notFound("作業指示が見つかりません");

    const text = `${input.symptoms} ${input.errorCodes || ""}`.toLowerCase();
    const best = text.includes("ブレーキ") || text.includes("鳴き") || text.includes("異音")
      ? { title: "ブレーキパッド交換", hours: 1.4, parts: ["ブレーキパッド"], confidence: 0.84 }
      : text.includes("p0420") || text.includes("触媒")
        ? { title: "触媒劣化診断", hours: 2.5, parts: ["O2センサー"], confidence: 0.78 }
        : { title: `${workOrder.make} ${workOrder.serviceType}標準点検`, hours: 1.8, parts: ["診断料"], confidence: 0.62 };

    const partRows = await tx.select().from(parts).where(inArray(parts.name, best.parts));
    const lineItems = [
      { type: "labor", description: best.title, quantity: best.hours, unitPrice: 8800 },
      ...best.parts.map((partName) => {
        const part = partRows.find((row: any) => row.name === partName);
        return {
          type: "part",
          description: part?.name || partName,
          quantity: 1,
          unitPrice: Number(part?.unitPrice || 3500),
          partId: part?.id,
        };
      }),
    ];
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = Math.round(subtotal * 0.1);
    const [created] = await tx.insert(estimates).values({
      tenantId,
      workOrderId: input.workOrderId,
      status: "draft",
      symptoms: input.symptoms,
      errorCodes: input.errorCodes || "",
      confidence: String(best.confidence),
      candidates: [best],
      lineItems,
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(subtotal + tax),
    }).returning();
    return created;
  });
  return c.json({ estimate }, 201);
});

estimateRoutes.post("/:id/finalize", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const invoice = await withTenant(tenantId, async (tx) => {
    const [estimate] = await tx.select().from(estimates).where(eq(estimates.id, id));
    if (!estimate) throw notFound("見積が見つかりません");
    if (estimate.status === "finalized") throw conflict("この見積は既に請求化されています");

    for (const item of ((estimate.lineItems as any[]) || [])) {
      if (item.partId) {
        await tx.update(parts).set({
          quantity: sql`greatest(0, ${parts.quantity} - ${Number(item.quantity)})`,
        }).where(eq(parts.id, item.partId));
      }
    }
    await tx.update(estimates).set({ status: "finalized" }).where(eq(estimates.id, id));
    const [{ nextNumber }] = await tx.select({ nextNumber: sql<number>`count(*) + 1` }).from(invoices).where(eq(invoices.tenantId, tenantId));
    const [created] = await tx.insert(invoices).values({
      tenantId,
      number: `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`,
      estimateId: estimate.id,
      workOrderId: estimate.workOrderId,
      lineItems: estimate.lineItems,
      subtotal: estimate.subtotal,
      tax: estimate.tax,
      total: estimate.total,
      paid: "0",
      status: "unpaid",
      payments: [],
    }).returning();
    return created;
  });
  return c.json({ invoice }, 201);
});
