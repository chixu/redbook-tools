export type InventoryData = {
  currentStock: Record<string, number>;
  stockTypes: Record<string, StockTypeConfig>;
  products: Record<string, ProductConfig>;
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  productionHistory: ProductionHistoryRecord[];
};

export type StockTypeConfig = {
  incCount: number;
  alertDates: number;
  arrivalDays?: number;
};

export type ProductConfig = {
  materials: Record<string, number>;
};

export type PurchaseOrder = {
  id: string;
  stockName: string;
  quantity: number;
  orderDate: string;
  estimatedArrivalDate: string;
  status: "pending" | "arrived";
  arrivedAt?: string;
};

export type StockMovement = {
  id: string;
  type: "purchase_arrived" | "consume" | "adjustment";
  stockName: string;
  quantity: number;
  date: string;
  relatedPurchaseOrderId?: string;
  relatedProductionRecordId?: string;
  note?: string;
};

export type ProductionHistoryRecord = {
  id: string;
  date: string;
  products: Record<string, number>;
  consumedMaterials: Record<string, number>;
  stockAfter: Record<string, number>;
};
