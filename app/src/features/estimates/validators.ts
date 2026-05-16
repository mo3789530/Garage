import { z } from "zod";

export const createAiEstimateSchema = z.object({
  workOrderId: z.string().uuid(),
  symptoms: z.string().trim().min(1),
  errorCodes: z.string().trim().default(""),
});
