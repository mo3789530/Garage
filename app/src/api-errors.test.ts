import { describe, expect, test } from "bun:test";
import app from "./index";

describe("API error responses", () => {
  test("propagates request id headers on API responses", async () => {
    const response = await app.fetch(new Request("http://localhost/health", {
      headers: { "x-request-id": "test-request-id" },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("test-request-id");
  });

  test("returns the standard shape for unknown routes", async () => {
    const response = await app.fetch(new Request("http://localhost/does-not-exist"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "route not found",
      },
    });
  });

  test("returns the standard shape for missing authorization", async () => {
    const response = await app.fetch(new Request("http://localhost/api/customers"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "authorization token is required",
      },
    });
  });

  test("returns the standard shape for invalid authorization", async () => {
    const response = await app.fetch(new Request("http://localhost/api/customers", {
      headers: { authorization: "Bearer invalid-token" },
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "invalid token",
      },
    });
  });

  test("returns validation details in the standard shape", async () => {
    const response = await app.fetch(new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "password" }),
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("validation failed");
    expect(body.error.details).toBeDefined();
  });

  test("returns invalid JSON errors in the standard shape", async () => {
    const response = await app.fetch(new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "invalid json body",
      },
    });
  });
});
