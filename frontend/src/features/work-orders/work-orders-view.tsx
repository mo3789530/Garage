import type { FormEvent } from "react";
import { WorkOrderRow } from "../../components/domain-rows";
import { Panel } from "../../components/panel";
import { Button } from "../../components/ui/button";
import type { Bootstrap } from "../../types";

export function WorkOrdersView(props: {
  data: Bootstrap;
  canAdvance: boolean;
  canEstimate: boolean;
  onAdvance: (id: string) => void;
  onEstimate: (payload: unknown) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    props.onEstimate({ workOrderId: values.workOrderId, symptoms: values.symptoms, errorCodes: values.errorCodes });
    form.reset();
  };

  return (
    <div className="section-grid wide-left">
      <Panel title="作業指示" count={`${props.data.workOrders.length}件`}>
        {props.data.workOrders.map((workOrder) => <WorkOrderRow key={workOrder.id} data={props.data} workOrder={workOrder} onAdvance={props.onAdvance} canAdvance={props.canAdvance} />)}
      </Panel>
      {props.canEstimate && <Panel title="AI見積">
        <form className="form-grid" onSubmit={submit}>
          <select name="workOrderId">{props.data.workOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.serviceType} / {workOrder.status}</option>)}</select>
          <textarea name="symptoms" required placeholder="症状・異音・警告灯など" />
          <input name="errorCodes" placeholder="エラーコード 例: P0420" />
          <Button className="primary">候補を生成</Button>
        </form>
      </Panel>}
    </div>
  );
}
