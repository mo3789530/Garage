import type { FormEvent } from "react";
import { Panel } from "../../components/panel";
import { Button } from "../../components/ui/button";
import { yen } from "../../lib/format";
import type { Bootstrap } from "../../types";

export function BillingView(props: {
  data: Bootstrap;
  canMutate: boolean;
  onFinalize: (id: string) => void;
  onPayment: (id: string, payload: unknown) => void;
}) {
  const openEstimates = props.data.estimates.filter((estimate) => !props.data.invoices.some((invoice) => invoice.estimateId === estimate.id));
  const payableInvoices = props.data.invoices.filter((invoice) => invoice.status !== "paid");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    props.onPayment(String(values.invoiceId), { amount: Number(values.amount), method: values.method });
    form.reset();
  };

  return (
    <div className="section-grid">
      <Panel title="見積・請求" count={`${props.data.estimates.length + props.data.invoices.length}件`}>
        {openEstimates.map((estimate) => (
          <article className="list-row" key={estimate.id}>
            <div><strong>見積 {estimate.id}</strong><span>{yen(estimate.total)} / 信頼度 {Math.round(estimate.confidence * 100)}%</span></div>
            {props.canMutate && <Button onClick={() => props.onFinalize(estimate.id)}>請求化</Button>}
          </article>
        ))}
        {props.data.invoices.map((invoice) => (
          <article className="list-row" key={invoice.id}>
            <div><strong>{invoice.number}</strong><span>{yen(invoice.total)} / 入金 {yen(invoice.paid)} / 残 {yen(invoice.total - invoice.paid)}</span></div>
            <span className={`status ${invoice.status === "paid" ? "success" : "warning"}`}>{invoice.status}</span>
          </article>
        ))}
      </Panel>
      {props.canMutate && <Panel title="支払い登録">
        <form className="form-grid" onSubmit={submit}>
          <select name="invoiceId">{payableInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} 残 {yen(invoice.total - invoice.paid)}</option>)}</select>
          <input name="amount" type="number" min="1" required placeholder="金額" />
          <select name="method"><option value="credit_card">クレジットカード</option><option value="qr">QR決済</option><option value="cash">現金</option></select>
          <Button className="primary" disabled={!payableInvoices.length}>入金を記録</Button>
        </form>
      </Panel>}
    </div>
  );
}
