import { beforeEach, describe, expect, test } from "bun:test";
import { clearToken, getToken, setToken } from "./api";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("auth token persistence", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: new MemoryStorage(),
    });
  });

  test("persists the login token for later API calls", () => {
    setToken("session-token");

    expect(getToken()).toBe("session-token");
  });

  test("clears the token during logout", () => {
    setToken("session-token");
    clearToken();

    expect(getToken()).toBeNull();
  });
});
