import { describe, expect, test } from "bun:test";
import { createCustomerSchema } from "./validators";

describe("customer validators", () => {
  test("accepts a valid customer with vehicle payload", () => {
    const payload = createCustomerSchema.parse({
      name: "佐藤 一郎",
      phone: "090-1111-2222",
      email: "sato@example.jp",
      address: "東京都品川区",
      vehicle: {
        make: "Toyota",
        model: "Prius",
        year: "2020",
        registrationNumber: "品川 330 あ 12-34",
        mileage: "12000",
        inspectionExpiresAt: "2026-12-31",
      },
    });

    expect(payload.vehicle.year).toBe(2020);
    expect(payload.vehicle.mileage).toBe(12000);
  });

  test("rejects invalid email and vehicle dates", () => {
    expect(() => createCustomerSchema.parse({
      name: "佐藤 一郎",
      phone: "090-1111-2222",
      email: "invalid",
      vehicle: {
        make: "Toyota",
        model: "Prius",
        year: 2020,
        registrationNumber: "品川 330 あ 12-34",
        inspectionExpiresAt: "not-a-date",
      },
    })).toThrow();
  });
});
