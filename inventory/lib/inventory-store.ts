import { promises as fs } from "fs";
import path from "path";
import { addDaysIso, todayIso } from "./date";
import { calculateConsumedMaterials, getArrivalDays } from "./inventory-math";
import type { InventoryData, PurchaseOrder, ProductionHistoryRecord, StockMovement } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "inventory.json");

const seedData: InventoryData = {
  currentStock: {},
  stockTypes: {},
  products: {},
  purchaseOrders: [],
  stockMovements: [],
  productionHistory: [],
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, JSON.stringify(seedData, null, 2), "utf8");
  }
}

export async function readInventoryData(): Promise<InventoryData> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const data = JSON.parse(raw) as InventoryData;
  return {
    currentStock: data.currentStock ?? {},
    stockTypes: data.stockTypes ?? {},
    products: data.products ?? {},
    purchaseOrders: data.purchaseOrders ?? [],
    stockMovements: data.stockMovements ?? [],
    productionHistory: data.productionHistory ?? [],
  };
}

async function writeInventoryData(data: InventoryData) {
  await ensureDataFile();
  await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizePayload(input: unknown, allowedNames: string[]) {
  if (!input || typeof input !== "object") {
    throw new Error("请求格式不正确");
  }

  const normalized: Record<string, number> = {};
  for (const [name, value] of Object.entries(input as Record<string, unknown>)) {
    if (!allowedNames.includes(name)) {
      throw new Error(`未知项目：${name}`);
    }
    if (!Number.isInteger(value) || Number(value) < 0) {
      throw new Error(`${name} 必须是非负整数`);
    }
    if (Number(value) > 0) {
      normalized[name] = Number(value);
    }
  }

  if (Object.keys(normalized).length === 0) {
    throw new Error("没有可提交的项目");
  }

  return normalized;
}

export async function createPurchaseOrders(items: unknown) {
  const data = await readInventoryData();
  const normalized = normalizePayload(items, Object.keys(data.stockTypes));
  const orderDate = todayIso();

  const newOrders: PurchaseOrder[] = Object.entries(normalized).map(([stockName, quantity]) => ({
    id: makeId("po"),
    stockName,
    quantity,
    orderDate,
    estimatedArrivalDate: addDaysIso(orderDate, getArrivalDays(data, stockName)),
    status: "pending",
  }));

  data.purchaseOrders.push(...newOrders);
  await writeInventoryData(data);
  return data;
}

export async function consumeProducts(products: unknown) {
  const data = await readInventoryData();
  const normalized = normalizePayload(products, Object.keys(data.products));
  const consumedMaterials = calculateConsumedMaterials(data.products, normalized);

  for (const stockName of Object.keys(consumedMaterials)) {
    if (!data.stockTypes[stockName]) {
      throw new Error(`产品配方引用了不存在的库存：${stockName}`);
    }
  }

  for (const [stockName, quantity] of Object.entries(consumedMaterials)) {
    data.currentStock[stockName] = (data.currentStock[stockName] ?? 0) - quantity;
  }

  const date = todayIso();
  const productionRecord: ProductionHistoryRecord = {
    id: makeId("prod"),
    date,
    products: normalized,
    consumedMaterials,
    stockAfter: { ...data.currentStock },
  };

  data.productionHistory.push(productionRecord);

  const movements: StockMovement[] = Object.entries(consumedMaterials).map(([stockName, quantity]) => ({
    id: makeId("move"),
    type: "consume",
    stockName,
    quantity: -quantity,
    date,
    relatedProductionRecordId: productionRecord.id,
  }));

  data.stockMovements.push(...movements);
  await writeInventoryData(data);
  return data;
}

export async function confirmReceiving(orderId: unknown) {
  if (typeof orderId !== "string" || orderId.length === 0) {
    throw new Error("orderId 不正确");
  }

  const data = await readInventoryData();
  const order = data.purchaseOrders.find((item) => item.id === orderId);
  if (!order) {
    throw new Error("找不到采购订单");
  }
  if (order.status !== "pending") {
    throw new Error("该订单已经确认到货");
  }

  const date = todayIso();
  order.status = "arrived";
  order.arrivedAt = date;
  data.currentStock[order.stockName] = (data.currentStock[order.stockName] ?? 0) + order.quantity;
  data.stockMovements.push({
    id: makeId("move"),
    type: "purchase_arrived",
    stockName: order.stockName,
    quantity: order.quantity,
    date,
    relatedPurchaseOrderId: order.id,
  });

  await writeInventoryData(data);
  return data;
}
