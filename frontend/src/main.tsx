import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, clearToken, setToken } from "./api";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { LoginView } from "./features/auth/login-view";
import { BillingView } from "./features/billing/billing-view";
import { CustomersView } from "./features/customers/customers-view";
import { DashboardView } from "./features/dashboard/dashboard-view";
import { InventoryView } from "./features/inventory/inventory-view";
import { ReservationsView } from "./features/reservations/reservations-view";
import { WorkOrdersView } from "./features/work-orders/work-orders-view";
import type { Bootstrap, Role, SessionUser } from "./types";
import "./styles.css";

type ViewId = "dashboard" | "customers" | "reservations" | "workorders" | "inventory" | "billing";

const views: Record<ViewId, string> = {
  dashboard: "ダッシュボード",
  customers: "顧客・車両",
  reservations: "予約",
  workorders: "作業指示",
  inventory: "部品在庫",
  billing: "請求",
};

const viewRoles: Record<ViewId, Role[]> = {
  dashboard: ["administrator", "manager", "service_advisor", "mechanic"],
  customers: ["administrator", "service_advisor"],
  reservations: ["administrator", "service_advisor"],
  workorders: ["administrator", "service_advisor", "mechanic"],
  inventory: ["administrator", "manager", "service_advisor", "mechanic"],
  billing: ["administrator", "manager", "service_advisor"],
};

function App() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [view, setView] = useState<ViewId>("dashboard");
  const [customerQuery, setCustomerQuery] = useState("");
  const [partQuery, setPartQuery] = useState("");
  const [toast, setToast] = useState("");
  const [loginError, setLoginError] = useState("");

  const refresh = async () => setData(await api.bootstrap());

  useEffect(() => {
    api.me()
      .then(({ user }) => {
        setUser(user);
        return refresh();
      })
      .catch(() => {
        clearToken();
        setUser(null);
        setData(null);
      });
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      await refresh();
      notify(message);
    } catch (error) {
      notify(error instanceof Error ? error.message : "処理に失敗しました");
    }
  };

  const login = async (payload: unknown) => {
    try {
      setLoginError("");
      const result = await api.login(payload);
      setToken(result.token);
      setUser(result.user);
      await refresh();
      notify("ログインしました");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "ログインに失敗しました");
    }
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    clearToken();
    setUser(null);
    setData(null);
    setView("dashboard");
  };

  if (!user) {
    return <LoginView onSubmit={login} error={loginError} />;
  }

  const customers = useMemo(() => {
    if (!data) return [];
    const needle = customerQuery.trim().toLowerCase();
    if (!needle) return data.customers;
    return data.customers.filter((customer) => {
      const vehicles = data.vehicles.filter((vehicle) => vehicle.customerId === customer.id);
      return [customer.name, customer.phone, customer.email, ...vehicles.map((vehicle) => vehicle.registrationNumber)]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [customerQuery, data]);

  const parts = useMemo(() => {
    if (!data) return [];
    const needle = partQuery.trim().toLowerCase();
    if (!needle) return data.parts;
    return data.parts.filter((part) =>
      [part.name, part.number, part.compatibility].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [data, partQuery]);

  if (!data) {
    return <main className="loading">Garage OS を起動中</main>;
  }

  const visibleViews = Object.entries(views).filter(([key]) => viewRoles[key as ViewId].includes(user.role));
  const canMutateCustomers = hasRole(user.role, ["administrator", "service_advisor"]);
  const canMutateWorkOrders = hasRole(user.role, ["administrator", "service_advisor", "mechanic"]);
  const canMutateBilling = hasRole(user.role, ["administrator", "service_advisor"]);
  const canMutateInventory = hasRole(user.role, ["administrator", "service_advisor"]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <div>
            <strong>Garage OS</strong>
            <span>{data.tenant.name}</span>
          </div>
        </div>
        <nav className="nav">
          {visibleViews.map(([key, label]) => (
            <Button key={key} variant="ghost" className={view === key ? "active" : ""} onClick={() => setView(key as ViewId)}>
              {label}
            </Button>
          ))}
          <Button variant="ghost" onClick={logout}>ログアウト</Button>
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">整備工場オペレーション</p>
            <h1>{views[view]}</h1>
          </div>
          <div className="topbar-actions">
            <Badge>{roleLabel(user.role)}</Badge>
            <Badge variant="warning">リマインド {data.tenant.reminderDays}日前</Badge>
          </div>
        </header>

        {view === "dashboard" && <DashboardView data={data} />}
        {view === "customers" && (
          <CustomersView
            data={data}
            customers={customers}
            query={customerQuery}
            setQuery={setCustomerQuery}
            canMutate={canMutateCustomers}
            onSubmit={(payload) => run(() => api.createCustomer(payload), "顧客と車両を登録しました")}
          />
        )}
        {view === "reservations" && (
          <ReservationsView
            data={data}
            canMutate={canMutateCustomers}
            onSubmit={(payload) => run(() => api.createReservation(payload), "予約と作業指示を作成しました")}
          />
        )}
        {view === "workorders" && (
          <WorkOrdersView
            data={data}
            canAdvance={canMutateWorkOrders}
            canEstimate={canMutateCustomers}
            onAdvance={(id) => run(() => api.advanceWorkOrder(id), "作業ステータスを更新しました")}
            onEstimate={(payload) => run(() => api.createAiEstimate(payload), "AI見積を作成しました")}
          />
        )}
        {view === "inventory" && (
          <InventoryView
            data={data}
            parts={parts}
            query={partQuery}
            setQuery={setPartQuery}
            canMutate={canMutateInventory}
            onCreatePart={(payload) => run(() => api.createPart(payload), "部品を登録しました")}
            onAdjustPart={(id, payload) => run(() => api.adjustPart(id, payload), "在庫を調整しました")}
            onPurchaseOrder={(payload) => run(() => api.createPurchaseOrder(payload), "発注書を作成しました")}
          />
        )}
        {view === "billing" && (
          <BillingView
            data={data}
            canMutate={canMutateBilling}
            onFinalize={(id) => run(() => api.finalizeEstimate(id), "見積を請求化しました")}
            onPayment={(id, payload) => run(() => api.recordPayment(id, payload), "入金を登録しました")}
          />
        )}
      </main>
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

function hasRole(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}

function roleLabel(role: Role) {
  return {
    administrator: "管理者",
    manager: "マネージャー",
    service_advisor: "フロント",
    mechanic: "整備士",
  }[role];
}
