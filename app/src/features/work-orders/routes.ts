import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { requireRole, type ApiEnv } from "../../http";
import { withTenant } from "../../db/client";
import { workOrders } from "../../db/schema";
import { notFound } from "../../errors";

const statuses = ["予約済み", "入庫", "作業中", "完了", "引渡し済み"];
export const workOrderRoutes = new Hono<ApiEnv>();

workOrderRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await withTenant(tenantId, (tx) =>
    tx.select().from(workOrders).where(eq(workOrders.tenantId, tenantId)).orderBy(workOrders.createdAt),
  );
  return c.json({ workOrders: rows });
});

workOrderRoutes.patch("/:id/advance", requireRole(["administrator", "service_advisor", "mechanic"]), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const workOrder = await withTenant(tenantId, async (tx) => {
    const [current] = await tx.select().from(workOrders).where(eq(workOrders.id, id));
    if (!current) throw notFound("作業指示が見つかりません");
    const index = statuses.indexOf(current.status);
    const next = statuses[Math.min(index + 1, statuses.length - 1)];
    const history = [
      ...((current.statusHistory as any[]) || []),
      { status: next, mechanicId: current.mechanicIds[0], at: new Date().toISOString() },
    ];
    const [updated] = await tx.update(workOrders).set({
      status: next,
      completedAt: next === "完了" ? sql`now()` : current.completedAt,
      statusHistory: history,
    }).where(eq(workOrders.id, id)).returning();
    return updated;
  });
  return c.json({ workOrder });
});
