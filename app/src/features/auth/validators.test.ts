import { describe, expect, test } from "bun:test";
import { loginSchema } from "./validators";

describe("auth validators", () => {
  test("accepts valid login payload", () => {
    const payload = loginSchema.parse({
      email: "admin@example.jp",
      password: "password",
    });

    expect(payload.email).toBe("admin@example.jp");
  });

  test("rejects invalid email", () => {
    expect(() => loginSchema.parse({
      email: "not-an-email",
      password: "password",
    })).toThrow();
  });
});
