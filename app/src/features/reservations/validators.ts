import { z } from "zod";

export const createReservationSchema = z.object({
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  mechanicId: z.string().uuid(),
  serviceType: z.enum(["車検", "修理", "点検", "板金"]),
  startsAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid datetime"),
  loanerRequested: z.coerce.boolean().default(false),
  notes: z.string().trim().default(""),
});
