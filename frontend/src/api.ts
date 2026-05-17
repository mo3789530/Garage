import type { Bootstrap, SessionUser } from "./types";

const TENANT_ID = import.meta.env.VITE_TENANT_ID || "00000000-0000-0000-0000-000000000001";
const TOKEN_KEY = "garage-os-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : { "X-Tenant-Id": TENANT_ID }),
      ...init?.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.error || "API request failed");
  }
  return data;
}

export const api = {
  login: (payload: unknown) =>
    request<{ token: string; expiresAt: number; user: SessionUser }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<{ user: SessionUser }>("/api/auth/me"),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  bootstrap: async () => normalizeBootstrap(await request<any>("/api/bootstrap")),
  createCustomer: (payload: unknown) =>
    request("/api/customers", { method: "POST", body: JSON.stringify(payload) }),
  createReservation: (payload: unknown) =>
    request("/api/reservations", { method: "POST", body: JSON.stringify(payload) }),
  advanceWorkOrder: (id: string) =>
    request(`/api/work-orders/${id}/advance`, { method: "PATCH" }),
  createAiEstimate: (payload: unknown) =>
    request("/api/estimates/ai", { method: "POST", body: JSON.stringify(payload) }),
  finalizeEstimate: (id: string) =>
    request(`/api/estimates/${id}/finalize`, { method: "POST" }),
  recordPayment: (id: string, payload: unknown) =>
    request(`/api/invoices/${id}/payments`, { method: "POST", body: JSON.stringify(payload) }),
  createPart: (payload: unknown) =>
    request("/api/parts", { method: "POST", body: JSON.stringify(payload) }),
  adjustPart: (id: string, payload: unknown) =>
    request(`/api/parts/${id}/adjustments`, { method: "POST", body: JSON.stringify(payload) }),
  createPurchaseOrder: (payload: unknown) =>
    request("/api/parts/purchase-orders", { method: "POST", body: JSON.stringify(payload) }),
};

function normalizeBootstrap(data: any): Bootstrap {
  return {
    tenant: {
      id: data.tenant.id,
      name: data.tenant.name,
      reminderDays: Number(data.tenant.reminderDays ?? data.tenant.reminder_days),
    },
    customers: data.customers,
    vehicles: data.vehicles.map((vehicle: any) => ({
      id: vehicle.id,
      customerId: vehicle.customerId ?? vehicle.customer_id,
      make: vehicle.make,
      model: vehicle.model,
      year: Number(vehicle.year),
      registrationNumber: vehicle.registrationNumber ?? vehicle.registration_number,
      vin: vehicle.vin,
      mileage: Number(vehicle.mileage),
      inspectionExpiresAt: vehicle.inspectionExpiresAt ?? vehicle.inspection_expires_at,
    })),
    mechanics: data.mechanics,
    reservations: data.reservations.map((reservation: any) => ({
      id: reservation.id,
      customerId: reservation.customerId ?? reservation.customer_id,
      vehicleId: reservation.vehicleId ?? reservation.vehicle_id,
      mechanicId: reservation.mechanicId ?? reservation.mechanic_id,
      serviceType: reservation.serviceType ?? reservation.service_type,
      startsAt: reservation.startsAt ?? reservation.starts_at,
      loanerRequested: reservation.loanerRequested ?? reservation.loaner_requested,
      notes: reservation.notes,
      status: reservation.status,
    })),
    workOrders: data.workOrders.map((workOrder: any) => ({
      id: workOrder.id,
      customerId: workOrder.customerId ?? workOrder.customer_id,
      vehicleId: workOrder.vehicleId ?? workOrder.vehicle_id,
      serviceType: workOrder.serviceType ?? workOrder.service_type,
      status: workOrder.status,
      estimatedHours: Number(workOrder.estimatedHours ?? workOrder.estimated_hours),
      statusHistory: workOrder.statusHistory ?? workOrder.status_history ?? [],
    })),
    estimates: data.estimates.map((estimate: any) => ({
      id: estimate.id,
      workOrderId: estimate.workOrderId ?? estimate.work_order_id,
      status: estimate.status,
      confidence: Number(estimate.confidence),
      lineItems: estimate.lineItems ?? estimate.line_items ?? [],
      subtotal: Number(estimate.subtotal),
      tax: Number(estimate.tax),
      total: Number(estimate.total),
    })),
    invoices: data.invoices.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.number,
      estimateId: invoice.estimateId ?? invoice.estimate_id,
      total: Number(invoice.total),
      paid: Number(invoice.paid),
      status: invoice.status,
    })),
    parts: data.parts.map((part: any) => normalizePart(part)),
    purchaseOrders: (data.purchaseOrders || []).map((purchaseOrder: any) => ({
      id: purchaseOrder.id,
      supplierName: purchaseOrder.supplierName ?? purchaseOrder.supplier_name,
      status: purchaseOrder.status,
      expectedDeliveryAt: purchaseOrder.expectedDeliveryAt ?? purchaseOrder.expected_delivery_at,
      lineItems: purchaseOrder.lineItems ?? purchaseOrder.line_items ?? [],
      createdAt: purchaseOrder.createdAt ?? purchaseOrder.created_at,
    })),
    reminders: data.reminders.map((reminder: any) => ({
      customer: {
        id: reminder.customerId ?? reminder.customer_id,
        name: reminder.customerName ?? reminder.customer_name,
        phone: reminder.customerPhone ?? reminder.customer_phone,
        email: reminder.customerEmail ?? reminder.customer_email,
        address: "",
      },
      vehicle: {
        id: reminder.vehicleId ?? reminder.vehicle_id,
        customerId: reminder.customerId ?? reminder.customer_id,
        make: reminder.make,
        model: reminder.model,
        year: Number(reminder.year),
        registrationNumber: reminder.registrationNumber ?? reminder.registration_number,
        vin: reminder.vin,
        mileage: Number(reminder.mileage),
        inspectionExpiresAt: reminder.inspectionExpiresAt ?? reminder.inspection_expires_at,
      },
      daysLeft: Number(reminder.daysLeft ?? reminder.days_left),
    })),
    lowStockParts: data.lowStockParts.map((part: any) => normalizePart(part)),
    kpis: {
      totalRevenue: Number(data.kpis.totalRevenue ?? data.kpis.total_revenue),
      paidRevenue: Number(data.kpis.paidRevenue ?? data.kpis.paid_revenue),
      averageInvoice: Number(data.kpis.averageInvoice ?? data.kpis.average_invoice),
      completedWorkOrders: Number(data.kpis.completedWorkOrders ?? data.kpis.completed_work_orders),
      mechanicUtilizationRate: Number(data.kpis.mechanicUtilizationRate ?? data.kpis.mechanic_utilization_rate),
      returningCustomers: Number(data.kpis.returningCustomers ?? data.kpis.returning_customers),
      lowStockCount: Number(data.kpis.lowStockCount ?? data.kpis.low_stock_count),
    },
  };
}

function normalizePart(part: any) {
  return {
    id: part.id,
    number: part.number,
    name: part.name,
    compatibility: part.compatibility,
    quantity: Number(part.quantity),
    minQuantity: Number(part.minQuantity ?? part.min_quantity),
    unitPrice: Number(part.unitPrice ?? part.unit_price),
  };
}
