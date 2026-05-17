import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { authRoutes } from "./features/auth/routes";
import { billingRoutes } from "./features/billing/routes";
import { customerRoutes } from "./features/customers/routes";
import { dashboardRoutes } from "./features/dashboard/routes";
import { estimateRoutes } from "./features/estimates/routes";
import { partRoutes } from "./features/parts/routes";
import { reservationRoutes } from "./features/reservations/routes";
import { workOrderRoutes } from "./features/work-orders/routes";
import { requestContextMiddleware, tenantMiddleware, type ApiEnv } from "./http";
import { apiErrorBody } from "./errors";

const app = new Hono<ApiEnv>();

app.use("*", requestContextMiddleware);
app.use("*", cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));

app.get("/health", (c) => c.json({ ok: true }));

app.route("/api/auth", authRoutes);
app.use("/api/*", tenantMiddleware);
app.route("/api/bootstrap", dashboardRoutes);
app.route("/api/customers", customerRoutes);
app.route("/api/reservations", reservationRoutes);
app.route("/api/work-orders", workOrderRoutes);
app.route("/api/estimates", estimateRoutes);
app.route("/api/invoices", billingRoutes);
app.route("/api/parts", partRoutes);

app.notFound((c) => c.json(apiErrorBody("NOT_FOUND", "route not found"), 404));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    const cause = error.cause;
    return c.json(
      apiErrorBody(statusToCode(error.status), error.message, cause),
      error.status,
    );
  }

  console.error(error);
  return c.json(apiErrorBody("INTERNAL_ERROR", "internal server error"), 500);
});

function statusToCode(status: number) {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  return "HTTP_ERROR";
}

export default {
  port: Number(process.env.PORT || 3000),
  fetch: app.fetch,
};
