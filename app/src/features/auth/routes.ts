import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { db } from "../../db/client";
import { authAuditLogs } from "../../db/schema";
import { apiErrorBody, parseJson } from "../../errors";
import { findUserMembership, findUserMembershipById, jwtSecret, type ApiEnv } from "../../http";
import { loginSchema } from "./validators";

export const authRoutes = new Hono<ApiEnv>();

authRoutes.post("/login", async (c) => {
  const input = await parseJson(c.req.raw, loginSchema);
  const membership = await findUserMembership(input.email);

  if (!membership || !(await Bun.password.verify(input.password, membership.passwordHash))) {
    await writeAudit({
      email: input.email,
      event: "login_failed",
      ipAddress: c.req.header("x-forwarded-for") || "",
      userAgent: c.req.header("user-agent") || "",
    });
    return c.json(apiErrorBody("INVALID_CREDENTIALS", "email or password is invalid"), 401);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
  const token = await sign({
    sub: membership.userId,
    tenantId: membership.tenantId,
    role: membership.role,
    exp: expiresAt,
  }, jwtSecret());

  await writeAudit({
    tenantId: membership.tenantId,
    userId: membership.userId,
    email: membership.email,
    event: "login_success",
    ipAddress: c.req.header("x-forwarded-for") || "",
    userAgent: c.req.header("user-agent") || "",
  });

  return c.json({
    token,
    expiresAt,
    user: {
      id: membership.userId,
      email: membership.email,
      name: membership.name,
      role: membership.role,
      tenant: {
        id: membership.tenantId,
        name: membership.tenantName,
      },
    },
  });
});

authRoutes.get("/me", async (c) => {
  const authorization = c.req.header("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!token) return c.json(apiErrorBody("UNAUTHORIZED", "authorization token is required"), 401);

  const payload = await verify(token, jwtSecret()).catch(() => null);
  if (!payload || typeof payload.sub !== "string") {
    return c.json(apiErrorBody("UNAUTHORIZED", "invalid token"), 401);
  }

  const membership = await findUserMembershipById(payload.sub, String(payload.tenantId || ""));
  if (!membership) return c.json(apiErrorBody("FORBIDDEN", "tenant membership was not found"), 403);

  return c.json({
    user: {
      id: membership.userId,
      email: membership.email,
      name: membership.name,
      role: membership.role,
      tenant: {
        id: membership.tenantId,
        name: membership.tenantName,
      },
    },
  });
});

authRoutes.post("/logout", (c) => c.json({ ok: true }));

async function writeAudit(input: {
  tenantId?: string;
  userId?: string;
  email: string;
  event: string;
  ipAddress: string;
  userAgent: string;
}) {
  await db.insert(authAuditLogs).values({
    tenantId: input.tenantId,
    userId: input.userId,
    email: input.email,
    event: input.event,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}
