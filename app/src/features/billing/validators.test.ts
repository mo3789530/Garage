import { describe, expect, test } from "bun:test";
import { recordPaymentSchema } from "./validators";

describe("billing validators", () => {
  test("accepts a valid payment payload", () => {
    const payload = recordPaymentSchema.parse({
      amount: "12000",
      method: "cash",
    });

    expect(payload.amount).toBe(12000);
  });

  test("rejects zero amount and unsupported payment method", () => {
    expect(() => recordPaymentSchema.parse({
      amount: 0,
      method: "crypto",
    })).toThrow();
  });
});
