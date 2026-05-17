import { Button } from "./ui/button";
import { dateTime } from "../lib/format";
import type { Bootstrap, Vehicle, WorkOrder } from "../types";

export function VehicleChip({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="vehicle-chip">
      <b>{vehicle.make} {vehicle.model}</b>
      <span>{vehicle.registrationNumber}</span>
      <span>{vehicle.mileage.toLocaleString()}km</span>
      <span>車検 {vehicle.inspectionExpiresAt}</span>
    </div>
  );
}

export function ReservationRow({ data, reservation }: { data: Bootstrap; reservation: Bootstrap["reservations"][number] }) {
  const customer = data.customers.find((item) => item.id === reservation.customerId);
  const vehicle = data.vehicles.find((item) => item.id === reservation.vehicleId);
  const mechanic = data.mechanics.find((item) => item.id === reservation.mechanicId);
  return (
    <article className="list-row">
      <div>
        <strong>{dateTime(reservation.startsAt)} / {reservation.serviceType}</strong>
        <span>{customer?.name} - {vehicle?.registrationNumber} / 担当 {mechanic?.name}</span>
      </div>
      <span className={`status ${reservation.loanerRequested ? "info" : ""}`}>{reservation.loanerRequested ? "代車" : reservation.status}</span>
    </article>
  );
}

export function WorkOrderRow({ data, workOrder, canAdvance = true, onAdvance }: { data: Bootstrap; workOrder: WorkOrder; canAdvance?: boolean; onAdvance: (id: string) => void }) {
  const customer = data.customers.find((item) => item.id === workOrder.customerId);
  const vehicle = data.vehicles.find((item) => item.id === workOrder.vehicleId);
  return (
    <article className="list-row stacked">
      <div className="row-main">
        <div><strong>{customer?.name} / {workOrder.serviceType}</strong><span>{vehicle?.make} {vehicle?.model} {vehicle?.registrationNumber}</span></div>
        <span className="status">{workOrder.status}</span>
      </div>
      <div className="action-row">
        <span>予定 {workOrder.estimatedHours}h / 履歴 {workOrder.statusHistory.length}件</span>
        {canAdvance && <Button onClick={() => onAdvance(workOrder.id)}>次のステータスへ</Button>}
      </div>
    </article>
  );
}
