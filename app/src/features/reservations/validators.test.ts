import { describe, expect, test } from "bun:test";
import { createReservationSchema } from "./validators";

describe("reservation validators", () => {
  test("accepts a valid reservation payload", () => {
    const reservation = createReservationSchema.parse({
      customerId: "11111111-1111-4111-8111-111111111111",
      vehicleId: "22222222-2222-4222-8222-222222222221",
      mechanicId: "33333333-3333-4333-8333-333333333331",
      serviceType: "車検",
      startsAt: "2026-05-17T10:00:00+09:00",
      loanerRequested: "true",
    });

    expect(reservation.loanerRequested).toBe(true);
  });

  test("rejects unsupported service type", () => {
    expect(() => createReservationSchema.parse({
      customerId: "11111111-1111-4111-8111-111111111111",
      vehicleId: "22222222-2222-4222-8222-222222222221",
      mechanicId: "33333333-3333-4333-8333-333333333331",
      serviceType: "洗車",
      startsAt: "2026-05-17T10:00:00+09:00",
    })).toThrow();
  });
});
