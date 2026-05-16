import { describe, expect, test } from "bun:test";
import { adjustPartSchema, createPartSchema, createPurchaseOrderSchema } from "./validators";

describe("parts validators", () => {
  test("accepts a valid part payload", () => {
    const part = createPartSchema.parse({
      number: "BRK-PD-002",
      name: "ブレーキパッド",
      compatibility: "Toyota Prius",
      quantity: "4",
      minQuantity: "2",
      unitPrice: "9800",
    });

    expect(part.quantity).toBe(4);
    expect(part.minQuantity).toBe(2);
    expect(part.unitPrice).toBe(9800);
  });

  test("rejects zero stock adjustment", () => {
    expect(() => adjustPartSchema.parse({
      quantityDelta: 0,
      reason: "correction",
    })).toThrow();
  });

  test("requires purchase order line items", () => {
    expect(() => createPurchaseOrderSchema.parse({
      supplierName: "部品商会",
      lineItems: [],
    })).toThrow();
  });
});
