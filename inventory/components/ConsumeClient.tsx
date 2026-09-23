"use client";

import { useMemo, useState } from "react";
import { NumberStepper } from "./NumberStepper";
import type { InventoryData } from "@/lib/types";

export function ConsumeClient({ data }: { data: InventoryData }) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productNames = Object.keys(data.products);
  const canSubmit = useMemo(() => Object.values(values).some((value) => value > 0), [values]);

  async function submit() {
    setIsSubmitting(true);
    setMessage("");
    const response = await fetch("/api/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: values }),
    });
    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result.error ?? "提交失败");
      return;
    }

    setValues({});
    setMessage("消耗已记录，库存已按配方扣减。");
  }

  return (
    <>
      <section className="workTable" aria-label="生产消耗表单">
        {productNames.map((productName) => {
          const materials = data.products[productName].materials;
          return (
            <article className="formRow tall" key={productName}>
              <div>
                <h2>{productName}</h2>
                <p>
                  {Object.entries(materials)
                    .map(([name, count]) => `${name} x${count}`)
                    .join(" · ")}
                </p>
              </div>
              <NumberStepper
                label={`${productName} 今日生产数量`}
                step={10}
                value={values[productName] ?? 0}
                onChange={(value) => setValues((current) => ({ ...current, [productName]: value }))}
              />
            </article>
          );
        })}
      </section>
      <div className="actionBar">
        <span>{message}</span>
        <button className="primaryButton" disabled={!canSubmit || isSubmitting} onClick={submit}>
          {isSubmitting ? "提交中" : "提交消耗"}
        </button>
      </div>
    </>
  );
}
