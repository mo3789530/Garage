import { z } from "zod";

export const createPartSchema = z.object({
  number: z.string().trim().min(1),
  name: z.string().trim().min(1),
  compatibility: z.string().trim().default(""),
  quantity: z.coerce.number().int().min(0).default(0),
  minQuantity: z.coerce.number().int().min(0).default(0),
  unitPrice: z.coerce.number().min(0).default(0),
});

export const adjustPartSchema = z.object({
  quantityDelta: z.coerce.number().int().refine((value) => value !== 0, "quantityDelta must not be 0"),
  reason: z.enum(["receive", "use", "correction", "return"]),
  memo: z.string().trim().default(""),
});

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().trim().min(1),
  expectedDeliveryAt: z.string().date().optional().or(z.literal("")),
  lineItems: z.array(z.object({
    partId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().min(0),
  })).min(1),
});
