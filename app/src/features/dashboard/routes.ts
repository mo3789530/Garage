import { Hono } from "hono";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import type { ApiEnv } from "../../http";
import { withTenant } from "../../db/client";
import { customers, estimates, invoices, mechanics, parts, purchaseOrders, reservations, tenants, vehicles, workOrders } from "../../db/schema";

export const dashboardRoutes = new Hono<ApiEnv>();

dashboardRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const data = await withTenant(tenantId, async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.id, tenantId));
    const customerRows = await tx.select().from(customers).where(eq(customers.tenantId, tenantId)).orderBy(customers.createdAt);
    const vehicleRows = await tx.select().from(vehicles).where(eq(vehicles.tenantId, tenantId)).orderBy(vehicles.createdAt);
    const mechanicRows = await tx.select().from(mechanics).where(eq(mechanics.tenantId, tenantId)).orderBy(asc(mechanics.name));
    const reservationRows = await tx.select().from(reservations).where(eq(reservations.tenantId, tenantId)).orderBy(asc(reservations.startsAt));
    const workOrderRows = await tx.select().from(workOrders).where(eq(workOrders.tenantId, tenantId)).orderBy(workOrders.createdAt);
    const estimateRows = await tx.select().from(estimates).where(eq(estimates.tenantId, tenantId)).orderBy(estimates.createdAt);
    const invoiceRows = await tx.select().from(invoices).where(eq(invoices.tenantId, tenantId)).orderBy(invoices.issuedAt);
    const partRows = await tx.select().from(parts).where(eq(parts.tenantId, tenantId)).orderBy(asc(parts.name));
    const purchaseOrderRows = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.tenantId, tenantId)).orderBy(purchaseOrders.createdAt);
    const reminderRows = await tx
      .select({
        vehicleId: vehicles.id,
        customerId: customers.id,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        registrationNumber: vehicles.registrationNumber,
        vin: vehicles.vin,
        mileage: vehicles.mileage,
        inspectionExpiresAt: vehicles.inspectionExpiresAt,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        daysLeft: sql<number>`${vehicles.inspectionExpiresAt}::date - current_date`,
      })
      .from(vehicles)
      .innerJoin(customers, eq(customers.id, vehicles.customerId))
      .where(
        and(
          eq(vehicles.tenantId, tenantId),
          sql`${vehicles.lastReminderSentAt} is null`,
          gte(vehicles.inspectionExpiresAt, sql`current_date`),
          lte(vehicles.inspectionExpiresAt, sql`current_date + (${tenant.reminderDays} || ' days')::interval`),
        ),
      )
      .orderBy(asc(vehicles.inspectionExpiresAt));

    const monthInvoices = invoiceRows.filter((invoice: any) => String(invoice.issuedAt).slice(0, 7) === new Date().toISOString().slice(0, 7));
    const totalRevenue = monthInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.total), 0);
    const paidRevenue = monthInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.paid), 0);
    const usedHours = workOrderRows.reduce((sum: number, order: any) => sum + Number(order.estimatedHours), 0);
    const returningCustomers = new Set(
      workOrderRows
        .map((order: any) => order.customerId)
        .filter((customerId: string) => workOrderRows.filter((order: any) => order.customerId === customerId).length > 1),
    );
    const lowStockRows = partRows.filter((part: any) => Number(part.quantity) <= Number(part.minQuantity));
    const kpis = {
      totalRevenue,
      paidRevenue,
      averageInvoice: monthInvoices.length ? totalRevenue / monthInvoices.length : 0,
      completedWorkOrders: workOrderRows.filter((order: any) => ["完了", "引渡し済み"].includes(order.status)).length,
      mechanicUtilizationRate: Math.min(100, Math.round((usedHours / Math.max(mechanicRows.length * 160, 1)) * 100)),
      returningCustomers: returningCustomers.size,
      lowStockCount: lowStockRows.length,
    };

    return {
      tenant,
      customers: customerRows,
      vehicles: vehicleRows,
      mechanics: mechanicRows,
      reservations: reservationRows,
      workOrders: workOrderRows,
      estimates: estimateRows,
      invoices: invoiceRows,
      parts: partRows,
      purchaseOrders: purchaseOrderRows,
      reminders: reminderRows,
      lowStockParts: lowStockRows,
      kpis,
    };
  });

  return c.json(data);
});
