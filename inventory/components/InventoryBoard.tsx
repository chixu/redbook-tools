import { AppShell } from "./AppShell";
import { shortDate, todayIso } from "@/lib/date";
import {
  averageConsumptionLastThreeDays,
  getReorderAdvice,
  groupInTransit,
  totalInTransitForStock,
} from "@/lib/inventory-math";
import { readInventoryData } from "@/lib/inventory-store";

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export async function InventoryBoard() {
  const data = await readInventoryData();
  const today = todayIso();
  const inTransit = groupInTransit(data.purchaseOrders);
  const averages = averageConsumptionLastThreeDays(data.productionHistory, today);
  const stockNames = Object.keys(data.stockTypes);
  const shouldBuyCount = stockNames.filter((stockName) => {
    const averageDailyConsumption = averages[stockName] ?? 0;
    const advice = getReorderAdvice({
      currentStock: data.currentStock[stockName] ?? 0,
      inTransitQuantity: totalInTransitForStock(inTransit, stockName),
      averageDailyConsumption,
      alertDates: data.stockTypes[stockName].alertDates,
    });
    return advice.shouldBuy;
  }).length;

  return (
    <AppShell title="库存总览" eyebrow="按最近三天消耗判断补货">
      <div className="summaryGrid">
        <div className="summaryCell">
          <span>库存种类</span>
          <strong>{stockNames.length}</strong>
        </div>
        <div className="summaryCell danger">
          <span>建议购买</span>
          <strong>{shouldBuyCount}</strong>
        </div>
        <div className="summaryCell">
          <span>待收货订单</span>
          <strong>{data.purchaseOrders.filter((order) => order.status === "pending").length}</strong>
        </div>
      </div>

      <section className="inventoryList" aria-label="库存状态">
        {stockNames.map((stockName) => {
          const currentStock = data.currentStock[stockName] ?? 0;
          const averageDailyConsumption = averages[stockName] ?? 0;
          const inTransitQuantity = totalInTransitForStock(inTransit, stockName);
          const advice = getReorderAdvice({
            currentStock,
            inTransitQuantity,
            averageDailyConsumption,
            alertDates: data.stockTypes[stockName].alertDates,
          });

          return (
            <article className="stockRow" key={stockName}>
              <div className="stockTitle">
                <h2>{stockName}</h2>
                <span className={advice.shouldBuy ? "pill buy" : "pill ok"}>
                  {advice.shouldBuy ? "应购买" : "暂不购买"}
                </span>
              </div>

              <div className="stockMetrics">
                <div>
                  <span>当前库存</span>
                  <strong>{currentStock}</strong>
                </div>
                <div>
                  <span>三天均耗</span>
                  <strong>{formatNumber(averageDailyConsumption)} / 天</strong>
                </div>
                <div>
                  <span>补货阈值</span>
                  <strong>{formatNumber(advice.threshold)}</strong>
                </div>
              </div>

              <div className="arrivalRail" aria-label={`${stockName} 运输中库存`}>
                <span className="railStart">{currentStock}</span>
                {(inTransit[stockName] ?? []).length === 0 ? (
                  <span className="railEmpty">运输中：无</span>
                ) : (
                  inTransit[stockName].map((item) => (
                    <span className="railChip" key={item.estimatedArrivalDate}>
                      +{item.quantity} <small>{shortDate(item.estimatedArrivalDate)}</small>
                    </span>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
