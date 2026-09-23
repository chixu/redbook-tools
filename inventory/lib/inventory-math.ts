import { previousIsoDates } from "./date";
import type { InventoryData, PurchaseOrder, ProductionHistoryRecord } from "./types";

export const INCLUDE_IN_TRANSIT_IN_REORDER_CHECK = false;

export type InTransitGroup = Record<string, Array<{ estimatedArrivalDate: string; quantity: number }>>;

export function validPositiveDays(value: number | undefined, fallback = 3) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

export function getArrivalDays(data: InventoryData, stockName: string) {
  const config = data.stockTypes[stockName];
  return validPositiveDays(config?.arrivalDays, validPositiveDays(config?.alertDates, 3));
}

export function groupInTransit(purchaseOrders: PurchaseOrder[]): InTransitGroup {
  const grouped: InTransitGroup = {};

  for (const order of purchaseOrders) {
    if (order.status !== "pending") continue;
    grouped[order.stockName] ??= [];
    const existing = grouped[order.stockName].find(
      (item) => item.estimatedArrivalDate === order.estimatedArrivalDate,
    );

    if (existing) {
      existing.quantity += order.quantity;
    } else {
      grouped[order.stockName].push({
        estimatedArrivalDate: order.estimatedArrivalDate,
        quantity: order.quantity,
      });
    }
  }

  for (const rows of Object.values(grouped)) {
    rows.sort((a, b) => a.estimatedArrivalDate.localeCompare(b.estimatedArrivalDate));
  }

  return grouped;
}

export function totalInTransitForStock(grouped: InTransitGroup, stockName: string) {
  return (grouped[stockName] ?? []).reduce((sum, item) => sum + item.quantity, 0);
}

export function averageConsumptionLastThreeDays(
  productionHistory: ProductionHistoryRecord[],
  today: string,
) {
  const dates = new Set(previousIsoDates(today, 3));
  const totals: Record<string, number> = {};

  for (const record of productionHistory) {
    if (!dates.has(record.date)) continue;
    for (const [stockName, quantity] of Object.entries(record.consumedMaterials)) {
      totals[stockName] = (totals[stockName] ?? 0) + quantity;
    }
  }

  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / 3]));
}

export function getReorderAdvice(params: {
  currentStock: number;
  inTransitQuantity: number;
  averageDailyConsumption: number;
  alertDates: number;
}) {
  const checkedStock = INCLUDE_IN_TRANSIT_IN_REORDER_CHECK
    ? params.currentStock + params.inTransitQuantity
    : params.currentStock;
  const threshold = params.averageDailyConsumption * params.alertDates;

  return {
    shouldBuy: params.averageDailyConsumption > 0 && checkedStock < threshold,
    threshold,
    checkedStock,
  };
}

export function calculateConsumedMaterials(
  products: InventoryData["products"],
  submittedProducts: Record<string, number>,
) {
  const consumed: Record<string, number> = {};

  for (const [productName, count] of Object.entries(submittedProducts)) {
    const recipe = products[productName];
    for (const [stockName, perUnit] of Object.entries(recipe.materials)) {
      consumed[stockName] = (consumed[stockName] ?? 0) + perUnit * count;
    }
  }

  return consumed;
}
