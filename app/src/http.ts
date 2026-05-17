import type { MiddlewareHandler } from "hono";
import { and, eq } from "drizzle-orm";
import { verify } from "hono/jwt";
import { db } from "./db/client";
import { tenantMemberships, tenants, users } from "./db/schema";
import { apiErrorBody } from "./errors";

export const roles = ["administrator", "manager", "service_advisor", "mechanic"] as const;
export type Role = typeof roles[number];

export type ApiEnv = {
  Variables: {
    tenantId: string;
    userId: string;
    role: Role;
    requestId: string;
  };
};

export const requestContextMiddleware: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  const startedAt = performance.now();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);

  await next();

  logRequest({
    requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    durationMs: Math.round(performance.now() - startedAt),
  });
};

export const tenantMiddleware: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const authorization = c.req.header("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";

  if (token) {
    const payload = await verify(token, jwtSecret(), "HS256").catch(() => null);
    if (!payload || typeof payload.sub !== "string" || typeof payload.tenantId !== "string") {
      return c.json(apiErrorBody("UNAUTHORIZED", "invalid token"), 401);
    }

    const [membership] = await db
      .select({
        tenantId: tenantMemberships.tenantId,
        userId: tenantMemberships.userId,
        role: tenantMemberships.role,
      })
      .from(tenantMemberships)
      .where(and(eq(tenantMemberships.userId, payload.sub), eq(tenantMemberships.tenantId, payload.tenantId)))
      .limit(1);

    if (!membership || !isRole(membership.role)) {
      return c.json(apiErrorBody("FORBIDDEN", "tenant membership was not found"), 403);
    }

    c.set("tenantId", membership.tenantId);
    c.set("userId", membership.userId);
    c.set("role", membership.role);
    await next();
    return;
  }

  if (!isDevTenantOverrideEnabled()) {
    return c.json(apiErrorBody("UNAUTHORIZED", "authorization token is required"), 401);
  }

  const tenantKey = c.req.header("x-tenant-id") || tenantFromHost(c.req.header("host"));
  if (!tenantKey) {
    return c.json(apiErrorBody("TENANT_REQUIRED", "tenant is required"), 400);
  }
  const tenant = await findTenant(tenantKey);
  if (!tenant) {
    return c.json(apiErrorBody("TENANT_NOT_FOUND", "tenant was not found"), 404);
  }

  c.set("tenantId", tenant.id);
  c.set("userId", "00000000-0000-0000-0000-000000000000");
  c.set("role", "administrator");
  await next();
};

export function requireRole(allowed: Role[]): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    if (!allowed.includes(c.get("role"))) {
      return c.json(apiErrorBody("FORBIDDEN", "insufficient role"), 403);
    }
    await next();
  };
}

export function jwtSecret() {
  const secret = process.env.JWT_SECRET || "";
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }
  return secret || "garage-os-dev-secret";
}

export function isDevTenantOverrideEnabled(env: Partial<Record<"ALLOW_DEV_TENANT_OVERRIDE" | "NODE_ENV", string>> = process.env) {
  return env.NODE_ENV !== "production" && env.ALLOW_DEV_TENANT_OVERRIDE === "true";
}

export async function findUserMembership(email: string) {
  const [row] = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      tenantId: tenantMemberships.tenantId,
      role: tenantMemberships.role,
      tenantName: tenants.name,
    })
    .from(users)
    .innerJoin(tenantMemberships, eq(tenantMemberships.userId, users.id))
    .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
    .where(eq(users.email, email))
    .limit(1);
  return row;
}

export async function findUserMembershipById(userId: string, tenantId: string) {
  const [row] = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      tenantId: tenantMemberships.tenantId,
      role: tenantMemberships.role,
      tenantName: tenants.name,
    })
    .from(users)
    .innerJoin(tenantMemberships, eq(tenantMemberships.userId, users.id))
    .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
    .where(and(eq(users.id, userId), eq(tenantMemberships.tenantId, tenantId)))
    .limit(1);
  return row;
}

function tenantFromHost(host?: string) {
  if (!host) return "";
  const [subdomain] = host.split(".");
  if (!subdomain || subdomain === "localhost" || subdomain === "127") return "";
  return subdomain;
}

async function findTenant(value: string) {
  const [tenant] = isUuid(value)
    ? await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, value)).limit(1)
    : await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, value)).limit(1);
  return tenant;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

function logRequest(entry: {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
}) {
  console.info(JSON.stringify({
    level: "info",
    message: "api_request",
    ...entry,
  }));
}
