import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  reminderDays: integer("reminder_days").notNull().default(60),
  brandColor: text("brand_color").notNull().default("#0f766e"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roleCheck: check(
      "tenant_memberships_role_check",
      sql`${table.role} in ('administrator', 'manager', 'service_advisor', 'mechanic')`,
    ),
    userIdx: index("idx_tenant_memberships_user").on(table.userId, table.tenantId),
    tenantUserUnique: uniqueIndex("tenant_memberships_tenant_user_unique").on(table.tenantId, table.userId),
  }),
);

export const authAuditLogs = pgTable(
  "auth_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull().default(""),
    event: text("event").notNull(),
    ipAddress: text("ip_address").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_auth_audit_logs_user").on(table.userId, table.createdAt),
  }),
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    address: text("address").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantNameIdx: index("idx_customers_tenant_name").on(table.tenantId, table.name),
  }),
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    registrationNumber: text("registration_number").notNull(),
    vin: text("vin").notNull().default(""),
    mileage: integer("mileage").notNull().default(0),
    inspectionExpiresAt: date("inspection_expires_at", { mode: "string" }).notNull(),
    insuranceExpiresAt: date("insurance_expires_at", { mode: "string" }).notNull(),
    lastReminderSentAt: timestamp("last_reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    registrationUnique: uniqueIndex("vehicles_tenant_registration_unique").on(table.tenantId, table.registrationNumber),
    registrationIdx: index("idx_vehicles_tenant_registration").on(table.tenantId, table.registrationNumber),
  }),
);

export const mechanics = pgTable("mechanics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    mechanicId: uuid("mechanic_id").notNull().references(() => mechanics.id),
    serviceType: text("service_type").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }).notNull(),
    loanerRequested: boolean("loaner_requested").notNull().default(false),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("予約済み"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    startsIdx: index("idx_reservations_tenant_starts").on(table.tenantId, table.startsAt),
  }),
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    mechanicIds: uuid("mechanic_ids").array().notNull().default(sql`'{}'::uuid[]`),
    serviceType: text("service_type").notNull(),
    status: text("status").notNull().default("予約済み"),
    estimatedHours: numeric("estimated_hours", { precision: 6, scale: 2 }).notNull().default("0"),
    actualMinutes: integer("actual_minutes").notNull().default(0),
    statusHistory: jsonb("status_history").notNull().default(sql`'[]'::jsonb`),
    checklist: jsonb("checklist").notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
  },
  (table) => ({
    statusIdx: index("idx_work_orders_tenant_status").on(table.tenantId, table.status),
  }),
);

export const parts = pgTable(
  "parts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    name: text("name").notNull(),
    compatibility: text("compatibility").notNull().default(""),
    quantity: integer("quantity").notNull().default(0),
    minQuantity: integer("min_quantity").notNull().default(0),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    numberUnique: uniqueIndex("parts_tenant_number_unique").on(table.tenantId, table.number),
    stockIdx: index("idx_parts_tenant_stock").on(table.tenantId, table.quantity, table.minQuantity),
  }),
);

export const partAdjustments = pgTable(
  "part_adjustments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    partId: uuid("part_id").notNull().references(() => parts.id, { onDelete: "cascade" }),
    quantityDelta: integer("quantity_delta").notNull(),
    reason: text("reason").notNull(),
    memo: text("memo").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantPartIdx: index("idx_part_adjustments_tenant_part").on(table.tenantId, table.partId, table.createdAt),
  }),
);

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    supplierName: text("supplier_name").notNull(),
    status: text("status").notNull().default("draft"),
    expectedDeliveryAt: date("expected_delivery_at", { mode: "string" }),
    lineItems: jsonb("line_items").notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantStatusIdx: index("idx_purchase_orders_tenant_status").on(table.tenantId, table.status, table.createdAt),
  }),
);

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"),
  symptoms: text("symptoms").notNull(),
  errorCodes: text("error_codes").notNull().default(""),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("0"),
  candidates: jsonb("candidates").notNull().default(sql`'[]'::jsonb`),
  lineItems: jsonb("line_items").notNull().default(sql`'[]'::jsonb`),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    estimateId: uuid("estimate_id").notNull().references(() => estimates.id),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id),
    lineItems: jsonb("line_items").notNull().default(sql`'[]'::jsonb`),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    paid: numeric("paid", { precision: 12, scale: 2 }).notNull().default("0"),
    status: text("status").notNull().default("unpaid"),
    payments: jsonb("payments").notNull().default(sql`'[]'::jsonb`),
    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    numberUnique: uniqueIndex("invoices_tenant_number_unique").on(table.tenantId, table.number),
  }),
);

export const customerRelations = relations(customers, ({ many }) => ({
  vehicles: many(vehicles),
  reservations: many(reservations),
  workOrders: many(workOrders),
}));
