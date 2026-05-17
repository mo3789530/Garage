export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type Vehicle = {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  vin: string;
  mileage: number;
  inspectionExpiresAt: string;
};

export type Mechanic = {
  id: string;
  name: string;
  skills: string[];
};

export type Reservation = {
  id: string;
  customerId: string;
  vehicleId: string;
  mechanicId: string;
  serviceType: string;
  startsAt: string;
  loanerRequested: boolean;
  notes: string;
  status: string;
};

export type WorkOrder = {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceType: string;
  status: string;
  estimatedHours: number;
  statusHistory: Array<{ status: string; mechanicId: string; at: string }>;
};

export type Part = {
  id: string;
  number: string;
  name: string;
  compatibility: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
};

export type PurchaseOrder = {
  id: string;
  supplierName: string;
  status: string;
  expectedDeliveryAt?: string | null;
  lineItems: Array<{ partId: string; quantity: number; unitPrice: number }>;
  createdAt: string;
};

export type Estimate = {
  id: string;
  workOrderId: string;
  status: "draft" | "finalized";
  confidence: number;
  lineItems: Array<{ type: string; description: string; quantity: number; unitPrice: number; partId?: string }>;
  subtotal: number;
  tax: number;
  total: number;
};

export type Invoice = {
  id: string;
  number: string;
  estimateId: string;
  total: number;
  paid: number;
  status: "unpaid" | "partial" | "paid";
};

export type Role = "administrator" | "manager" | "service_advisor" | "mechanic";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenant: {
    id: string;
    name: string;
  };
};

export type Bootstrap = {
  tenant: { id: string; name: string; reminderDays: number };
  customers: Customer[];
  vehicles: Vehicle[];
  mechanics: Mechanic[];
  reservations: Reservation[];
  workOrders: WorkOrder[];
  estimates: Estimate[];
  invoices: Invoice[];
  parts: Part[];
  purchaseOrders: PurchaseOrder[];
  reminders: Array<{ customer?: Customer; vehicle: Vehicle; daysLeft: number }>;
  lowStockParts: Part[];
  kpis: {
    totalRevenue: number;
    paidRevenue: number;
    averageInvoice: number;
    completedWorkOrders: number;
    mechanicUtilizationRate: number;
    returningCustomers: number;
    lowStockCount: number;
  };
};
