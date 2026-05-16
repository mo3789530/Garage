import { z } from "zod";

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["credit_card", "qr", "cash", "bank_transfer"]),
});
