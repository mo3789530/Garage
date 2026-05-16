import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email().or(z.literal("")).default(""),
  address: z.string().trim().default(""),
  vehicle: z.object({
    make: z.string().trim().min(1),
    model: z.string().trim().min(1),
    year: z.coerce.number().int().min(1900).max(2100),
    registrationNumber: z.string().trim().min(1),
    vin: z.string().trim().default(""),
    mileage: z.coerce.number().int().min(0).default(0),
    inspectionExpiresAt: z.string().date(),
    insuranceExpiresAt: z.string().date().optional(),
  }),
});
