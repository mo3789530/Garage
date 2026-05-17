import type { FormEvent } from "react";
import { Panel } from "../../components/panel";
import { Button } from "../../components/ui/button";
import { yen } from "../../lib/format";
import type { Bootstrap } from "../../types";

export function InventoryView(props: {
  data: Bootstrap;
  parts: Bootstrap["parts"];
  query: string;
  setQuery: (value: string) => void;
  canMutate: boolean;
  onCreatePart: (payload: unknown) => void;
  onAdjustPart: (id: string, payload: unknown) => void;
  onPurchaseOrder: (payload: unknown) => void;
}) {
  const createPart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    props.onCreatePart({
      number: values.number,
      name: values.name,
      compatibility: values.compatibility,
      quantity: Number(values.quantity || 0),
      minQuantity: Number(values.minQuantity || 0),
      unitPrice: Number(values.unitPrice || 0),
    });
    form.reset();
  };

  const adjustPart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    props.onAdjustPart(String(values.partId), {
      quantityDelta: Number(values.quantityDelta),
      reason: values.reason,
      memo: values.memo,
    });
    form.reset();
  };

  const createPurchaseOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const part = props.data.parts.find((item) => item.id === values.partId);
    props.onPurchaseOrder({
      supplierName: values.supplierName,
      expectedDeliveryAt: values.expectedDeliveryAt,
      lineItems: [{
        partId: values.partId,
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice || part?.unitPrice || 0),
      }],
    });
    form.reset();
  };

  return (
    <>
      <div className="toolbar">
        <label className="search-field">検索<input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="品番・部品名・適合" /></label>
      </div>
      <div className="section-grid wide-left">
        <Panel title="部品在庫" count={`${props.parts.length}件`}>
          {props.parts.map((part) => (
            <article className="list-row" key={part.id}>
              <div><strong>{part.name}</strong><span>{part.number} / {part.compatibility} / {yen(part.unitPrice)}</span></div>
              <span className={`status ${part.quantity <= part.minQuantity ? "warning" : ""}`}>{part.quantity}個</span>
            </article>
          ))}
        </Panel>
        {props.canMutate && <Panel title="部品登録">
          <form className="form-grid" onSubmit={createPart}>
            <input name="number" required placeholder="品番" />
            <input name="name" required placeholder="部品名" />
            <input name="compatibility" placeholder="適合車種" />
            <input name="quantity" type="number" min="0" placeholder="初期在庫" />
            <input name="minQuantity" type="number" min="0" placeholder="最低在庫" />
            <input name="unitPrice" type="number" min="0" placeholder="単価" />
            <Button className="primary">部品を登録</Button>
          </form>
        </Panel>}
      </div>
      <div className="section-grid follow-grid">
        {props.canMutate && <Panel title="在庫調整">
          <form className="form-grid" onSubmit={adjustPart}>
            <select name="partId" required>{props.data.parts.map((part) => <option key={part.id} value={part.id}>{part.name} / 現在 {part.quantity}</option>)}</select>
            <input name="quantityDelta" type="number" required placeholder="増減数 例: 5 / -1" />
            <select name="reason"><option value="receive">入庫</option><option value="use">使用</option><option value="correction">棚卸補正</option><option value="return">返品</option></select>
            <textarea name="memo" placeholder="メモ" />
            <Button className="primary">在庫を調整</Button>
          </form>
        </Panel>}
        <Panel title="低在庫・発注" count={`${props.data.lowStockParts.length}件`}>
          {props.data.lowStockParts.map((part) => (
            <article className="list-row" key={part.id}>
              <div><strong>{part.name}</strong><span>最小 {part.minQuantity} / 現在 {part.quantity}</span></div>
              <span className="status warning">発注</span>
            </article>
          ))}
          {props.canMutate && <form className="form-grid" onSubmit={createPurchaseOrder}>
            <select name="partId" required>{props.data.lowStockParts.concat(props.data.parts.filter((part) => !props.data.lowStockParts.some((low) => low.id === part.id))).map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}</select>
            <input name="supplierName" required placeholder="仕入先" />
            <input name="quantity" type="number" min="1" required placeholder="発注数" />
            <input name="unitPrice" type="number" min="0" placeholder="予定単価" />
            <input name="expectedDeliveryAt" type="date" />
            <Button className="primary">発注書を作成</Button>
          </form>}
        </Panel>
      </div>
      <div className="section-grid follow-grid">
        <Panel title="発注書" count={`${props.data.purchaseOrders.length}件`}>
          {props.data.purchaseOrders.map((order) => (
            <article className="list-row" key={order.id}>
              <div><strong>{order.supplierName}</strong><span>{order.lineItems.length}明細 / 納期 {order.expectedDeliveryAt || "未定"}</span></div>
              <span className="status info">{order.status}</span>
            </article>
          ))}
        </Panel>
      </div>
    </>
  );
}
