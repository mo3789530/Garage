import { Panel } from "../../components/panel";
import { ReservationRow } from "../../components/domain-rows";
import { yen } from "../../lib/format";
import type { Bootstrap } from "../../types";

export function DashboardView({ data }: { data: Bootstrap }) {
  const kpis = [
    ["今月売上", yen(data.kpis.totalRevenue), `入金済み ${yen(data.kpis.paidRevenue)}`],
    ["平均請求額", yen(data.kpis.averageInvoice), `${data.invoices.length}件の請求`],
    ["整備士稼働率", `${data.kpis.mechanicUtilizationRate}%`, "予定工数ベース"],
    ["完了作業", `${data.kpis.completedWorkOrders}件`, "引渡し前を含む"],
    ["再来店顧客", `${data.kpis.returningCustomers}名`, "複数作業履歴あり"],
    ["低在庫", `${data.kpis.lowStockCount}件`, "発注確認が必要"],
  ];

  return (
    <>
      <section className="kpi-grid">
        {kpis.map(([label, value, sub]) => (
          <article className="kpi-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
          </article>
        ))}
      </section>
      <div className="section-grid">
        <Panel title="予約" count={`${data.reservations.length}件`}>
          {data.reservations.map((reservation) => <ReservationRow key={reservation.id} data={data} reservation={reservation} />)}
        </Panel>
        <Panel title="車検リマインド" count={`${data.reminders.length}件`}>
          {data.reminders.map((reminder) => (
            <article className="list-row" key={reminder.vehicle.id}>
              <div>
                <strong>{reminder.customer?.name || "顧客未設定"}</strong>
                <span>{reminder.vehicle.make} {reminder.vehicle.model} / {reminder.vehicle.registrationNumber}</span>
              </div>
              <span className="status warning">{reminder.daysLeft}日後</span>
            </article>
          ))}
        </Panel>
      </div>
    </>
  );
}
