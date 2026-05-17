import { describe, expect, test } from "bun:test";
import { isDevTenantOverrideEnabled } from "./http";

describe("development tenant override guard", () => {
  test("requires explicit opt-in outside production", () => {
    expect(isDevTenantOverrideEnabled({ NODE_ENV: "development", ALLOW_DEV_TENANT_OVERRIDE: "true" })).toBe(true);
    expect(isDevTenantOverrideEnabled({ NODE_ENV: "test", ALLOW_DEV_TENANT_OVERRIDE: "true" })).toBe(true);
  });

  test("is disabled by default and always disabled in production", () => {
    expect(isDevTenantOverrideEnabled({ NODE_ENV: "development", ALLOW_DEV_TENANT_OVERRIDE: undefined })).toBe(false);
    expect(isDevTenantOverrideEnabled({ NODE_ENV: "development", ALLOW_DEV_TENANT_OVERRIDE: "false" })).toBe(false);
    expect(isDevTenantOverrideEnabled({ NODE_ENV: "production", ALLOW_DEV_TENANT_OVERRIDE: "true" })).toBe(false);
  });
});
