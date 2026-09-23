"use client";

import { useMemo, useState } from "react";
import { NumberStepper } from "./NumberStepper";
import type { InventoryData } from "@/lib/types";

export function PurchaseClient({ data }: { data: InventoryData }) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stockNames = Object.keys(data.stockTypes);
  const canSubmit = useMemo(() => Object.values(values).some((value) => value > 0), [values]);

  async function submit() {
    setIsSubmitting(true);
    setMessage("");
    const response = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: values }),
    });
    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result.error ?? "提交失败");
      return;
    }

    setValues({});
    setMessage("采购已提交，库存不会增加，待确认到货后入库。");
  }

  return (
    <>
      <section className="workTable" aria-label="采购表单">
        {stockNames.map((stockName) => {
          const config = data.stockTypes[stockName];
          return (
            <article className="formRow" key={stockName}>
              <div>
                <h2>{stockName}</h2>
                <p>当前 {data.currentStock[stockName] ?? 0} · 默认 +{config.incCount}</p>
              </div>
              <NumberStepper
                label={`${stockName} 采购数量`}
                step={config.incCount}
                value={values[stockName] ?? 0}
                onChange={(value) => setValues((current) => ({ ...current, [stockName]: value }))}
              />
            </article>
          );
        })}
      </section>
      <div className="actionBar">
        <span>{message}</span>
        <button className="primaryButton" disabled={!canSubmit || isSubmitting} onClick={submit}>
          {isSubmitting ? "提交中" : "提交采购"}
        </button>
      </div>
    </>
  );
}
