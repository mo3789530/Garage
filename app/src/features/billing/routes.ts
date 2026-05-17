import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { requireRole, type ApiEnv } from "../../http";
import { withTenant } from "../../db/client";
import { invoices } from "../../db/schema";
import { notFound, parseJson } from "../../errors";
import { recordPaymentSchema } from "./validators";

export const billingRoutes = new Hono<ApiEnv>();

billingRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await withTenant(tenantId, (tx) =>
    tx.select().from(invoices).where(eq(invoices.tenantId, tenantId)).orderBy(invoices.issuedAt),
  );
  return c.json({ invoices: rows });
});

billingRoutes.post("/:id/payments", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const input = await parseJson(c.req.raw, recordPaymentSchema);
  const invoice = await withTenant(tenantId, async (tx) => {
    const [current] = await tx.select().from(invoices).where(eq(invoices.id, id));
    if (!current) throw notFound("請求が見つかりません");
    const paid = Math.min(Number(current.total), Number(current.paid) + Number(input.amount));
    const payments = [
      ...(((current.payments as any[]) || [])),
      { amount: Number(input.amount), method: input.method, paidAt: new Date().toISOString() },
    ];
    const [updated] = await tx.update(invoices).set({
      paid: String(paid),
      status: paid >= Number(current.total) ? "paid" : "partial",
      payments,
    }).where(eq(invoices.id, id)).returning();
    return updated;
  });
  return c.json({ invoice }, 201);
});
