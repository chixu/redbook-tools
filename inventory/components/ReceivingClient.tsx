"use client";

import { useState } from "react";
import { isPastDate, shortDate, todayIso } from "@/lib/date";
import type { PurchaseOrder } from "@/lib/types";

export function ReceivingClient({ orders }: { orders: PurchaseOrder[] }) {
  const [pendingOrders, setPendingOrders] = useState(orders);
  const [message, setMessage] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const today = todayIso();

  async function confirm(orderId: string) {
    setActiveId(orderId);
    setMessage("");
    const response = await fetch("/api/receiving/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const result = await response.json();
    setActiveId(null);

    if (!response.ok) {
      setMessage(result.error ?? "确认失败");
      return;
    }

    setPendingOrders((current) => current.filter((order) => order.id !== orderId));
    setMessage("已确认到货，库存已入库。");
  }

  if (pendingOrders.length === 0) {
    return <section className="emptyState">暂无待收货订单</section>;
  }

  return (
    <>
      <section className="workTable" aria-label="待收货订单">
        {pendingOrders.map((order) => {
          const overdue = isPastDate(order.estimatedArrivalDate, today);
          return (
            <article className="formRow receiving" key={order.id}>
              <div>
                <h2>{order.stockName}</h2>
                <p>
                  {order.quantity} 件 · 下单 {shortDate(order.orderDate)} · 预计{" "}
                  {shortDate(order.estimatedArrivalDate)}
                </p>
              </div>
              <span className={overdue ? "pill buy" : "pill ok"}>{overdue ? "已超期" : "在路上"}</span>
              <button className="primaryButton small" disabled={activeId === order.id} onClick={() => confirm(order.id)}>
                {activeId === order.id ? "确认中" : "确认到货"}
              </button>
            </article>
          );
        })}
      </section>
      <div className="actionBar">
        <span>{message}</span>
      </div>
    </>
  );
}
