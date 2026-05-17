import { describe, expect, test } from "bun:test";
import { createAiEstimateSchema } from "./validators";

describe("estimate validators", () => {
  test("accepts a valid AI estimate payload", () => {
    const payload = createAiEstimateSchema.parse({
      workOrderId: "11111111-1111-4111-8111-111111111111",
      symptoms: "ブレーキ鳴き",
      errorCodes: "P0420",
    });

    expect(payload.symptoms).toBe("ブレーキ鳴き");
  });

  test("rejects invalid work order id and empty symptoms", () => {
    expect(() => createAiEstimateSchema.parse({
      workOrderId: "not-a-uuid",
      symptoms: "",
    })).toThrow();
  });
});
