import { Hono } from "hono";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { requireRole, type ApiEnv } from "../../http";
import { withTenant } from "../../db/client";
import { reservations, workOrders } from "../../db/schema";
import { conflict, parseJson } from "../../errors";
import { createReservationSchema } from "./validators";

export const reservationRoutes = new Hono<ApiEnv>();

reservationRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await withTenant(tenantId, (tx) =>
    tx.select().from(reservations).where(eq(reservations.tenantId, tenantId)).orderBy(reservations.startsAt),
  );
  return c.json({ reservations: rows });
});

reservationRoutes.post("/", requireRole(["administrator", "service_advisor"]), async (c) => {
  const tenantId = c.get("tenantId");
  const input = await parseJson(c.req.raw, createReservationSchema);

  const result = await withTenant(tenantId, async (tx) => {
    const conflicts = await tx
      .select({ id: reservations.id })
      .from(reservations)
      .where(
        and(
          eq(reservations.tenantId, tenantId),
          eq(reservations.mechanicId, input.mechanicId),
          gte(reservations.startsAt, sql`${input.startsAt}::timestamptz - interval '90 minutes'`),
          lte(reservations.startsAt, sql`${input.startsAt}::timestamptz + interval '90 minutes'`),
        ),
      )
      .limit(1);
    if (conflicts.length) throw conflict("同じ整備士の予約が近い時間帯に存在します");

    const [reservation] = await tx.insert(reservations).values({
      tenantId,
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      mechanicId: input.mechanicId,
      serviceType: input.serviceType,
      startsAt: input.startsAt,
      loanerRequested: Boolean(input.loanerRequested),
      notes: input.notes || "",
      status: "予約済み",
    }).returning();
    const hours = { 車検: 3.5, 修理: 2.5, 点検: 1.5, 板金: 5 }[input.serviceType as string] || 2;
    const checklist = input.serviceType === "車検"
      ? ["受付内容確認", "車両外観確認", "保安基準チェック", "検査書類確認", "完了検査"]
      : ["受付内容確認", "車両外観確認", "作業写真記録", "完了検査"];
    const [workOrder] = await tx.insert(workOrders).values({
      tenantId,
      reservationId: reservation.id,
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      mechanicIds: [input.mechanicId],
      serviceType: input.serviceType,
      status: "予約済み",
      estimatedHours: String(hours),
      checklist,
      statusHistory: [{ status: "予約済み", mechanicId: input.mechanicId, at: new Date().toISOString() }],
    }).returning();
    return { reservation, workOrder };
  });

  return c.json(result, 201);
});
