import type { FormEvent } from "react";
import { ReservationRow } from "../../components/domain-rows";
import { Panel } from "../../components/panel";
import { EmptyState } from "../../components/state";
import { Button } from "../../components/ui/button";
import { todayDateTimeLocal } from "../../lib/format";
import type { Bootstrap } from "../../types";

export function ReservationsView({ data, canMutate, onSubmit }: { data: Bootstrap; canMutate: boolean; onSubmit: (payload: unknown) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    onSubmit({
      customerId: values.customerId,
      vehicleId: values.vehicleId,
      mechanicId: values.mechanicId,
      serviceType: values.serviceType,
      startsAt: values.startsAt,
      loanerRequested: values.loanerRequested === "on",
      notes: values.notes || "",
    });
    form.reset();
  };

  return (
    <div className="section-grid">
      <Panel title="予約カレンダー" count={`${data.reservations.length}件`}>
        {!data.reservations.length && <EmptyState title="予約がありません" detail="新しい予約を作成すると一覧に表示されます。" />}
        {data.reservations.map((reservation) => <ReservationRow key={reservation.id} data={data} reservation={reservation} />)}
      </Panel>
      {canMutate && <Panel title="予約作成">
        <form className="form-grid" onSubmit={submit}>
          <select name="customerId" required>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select>
          <select name="vehicleId" required>{data.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber}</option>)}</select>
          <input name="startsAt" type="datetime-local" defaultValue={todayDateTimeLocal()} required />
          <select name="serviceType"><option>車検</option><option>修理</option><option>点検</option><option>板金</option></select>
          <select name="mechanicId">{data.mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}</select>
          <label className="check-row"><input name="loanerRequested" type="checkbox" /> 代車希望</label>
          <textarea name="notes" placeholder="受付メモ" />
          <Button className="primary">予約を作成</Button>
        </form>
      </Panel>}
    </div>
  );
}
