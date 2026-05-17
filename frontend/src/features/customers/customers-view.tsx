import type { FormEvent } from "react";
import { VehicleChip } from "../../components/domain-rows";
import { Panel } from "../../components/panel";
import { Button } from "../../components/ui/button";
import type { Bootstrap, Customer } from "../../types";

export function CustomersView(props: {
  data: Bootstrap;
  customers: Customer[];
  query: string;
  setQuery: (value: string) => void;
  canMutate: boolean;
  onSubmit: (payload: unknown) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    props.onSubmit({
      name: values.name,
      phone: values.phone,
      email: values.email,
      address: values.address,
      vehicle: {
        make: values.make,
        model: values.model,
        year: Number(values.year || new Date().getFullYear()),
        registrationNumber: values.registrationNumber,
        vin: values.vin,
        mileage: Number(values.mileage || 0),
        inspectionExpiresAt: values.inspectionExpiresAt,
      },
    });
    form.reset();
  };

  return (
    <>
      <div className="toolbar">
        <label className="search-field">検索<input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="氏名・電話・登録番号" /></label>
      </div>
      <div className="section-grid wide-left">
        <Panel title="顧客一覧" count={`${props.customers.length}件`}>
          {props.customers.map((customer) => {
            const vehicles = props.data.vehicles.filter((vehicle) => vehicle.customerId === customer.id);
            return (
              <article className="list-row stacked" key={customer.id}>
                <div className="row-main">
                  <div><strong>{customer.name}</strong><span>{customer.phone} / {customer.email}</span></div>
                  <span className="status">{customer.id}</span>
                </div>
                <div className="vehicle-stack">
                  {vehicles.map((vehicle) => <VehicleChip key={vehicle.id} vehicle={vehicle} />)}
                </div>
              </article>
            );
          })}
        </Panel>
        {props.canMutate && <Panel title="新規登録">
          <form className="form-grid" onSubmit={submit}>
            <input name="name" required placeholder="顧客名" />
            <input name="phone" required placeholder="電話番号" />
            <input name="email" type="email" placeholder="メール" />
            <input name="address" placeholder="住所" />
            <input name="make" required placeholder="メーカー" />
            <input name="model" required placeholder="車種" />
            <input name="year" type="number" placeholder="年式" />
            <input name="registrationNumber" required placeholder="登録番号" />
            <input name="vin" placeholder="VIN" />
            <input name="mileage" type="number" min="0" placeholder="走行距離" />
            <input name="inspectionExpiresAt" type="date" required />
            <Button className="primary">登録</Button>
          </form>
        </Panel>}
      </div>
    </>
  );
}
