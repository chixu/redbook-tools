# 电商仓库简单系统需求文档

## 1. 项目目标

本系统是一个本地运行的电商仓库库存管理工具，用于管理耗材库存、采购在途订单、每日产品生产消耗，以及基于最近三天损耗的补货提醒。

技术栈：

- TypeScript
- React
- Next.js
- 本地 JSON 文件作为后端数据存储
- 本地运行，默认访问地址为 `http://localhost:3000`

第一版不需要用户登录，不需要数据库，不需要设置页。库存种类、产品配方等基础数据直接编辑 JSON 文件。

## 2. 核心概念

### 2.1 库存物品

库存物品指会被产品生产消耗的耗材，例如：

- 贴纸
- 包装袋
- 卡片

每种库存物品有：

- 当前库存数量
- 默认采购增加数量
- 补货预警天数
- 可选的预计到货天数

### 2.2 产品

产品指每天生产的商品。一个产品可以消耗一种或多种库存物品。

例如：

```json
{
  "小红书套装A": {
    "materials": {
      "贴纸": 1,
      "包装袋": 1,
      "卡片": 2
    }
  }
}
```

如果当天生产 `小红书套装A` 100 件，则扣除：

- 贴纸 100
- 包装袋 100
- 卡片 200

### 2.3 采购订单

采购订单指已经下单但未必到货的库存采购记录。

采购提交后：

- 生成采购记录
- 状态为 `pending`
- 数量暂时不加入当前库存
- 首页显示为运输中数量
- 待收货页显示该订单

点击确认到货后：

- 订单状态改为 `arrived`
- 数量加入当前库存
- 记录实际到货时间
- 在库存历史记录中追加一条到货记录

### 2.4 库存历史记录

库存历史记录记录所有库存变动来源：

- 采购下单
- 采购到货
- 产品生产消耗

消耗记录使用负数数量。

### 2.5 产品生产历史记录

产品生产历史记录记录每天提交的产品生产数量，以及提交后当前库存快照。

## 3. 数据存储

数据存储在本地 JSON 文件中。建议第一版使用一个文件：

```text
data/inventory.json
```

### 3.1 数据结构

```ts
type InventoryData = {
  currentStock: Record<string, number>;
  stockTypes: Record<string, StockTypeConfig>;
  products: Record<string, ProductConfig>;
  stockHistory: StockHistoryRecord[];
  productionHistory: ProductionHistoryRecord[];
};

type StockTypeConfig = {
  incCount: number;
  alertDates: number;
  arrivalDays?: number;
};

type ProductConfig = {
  materials: Record<string, number>;
};

type StockHistoryRecord = {
  id: string;
  type: "purchase_ordered" | "purchase_arrived" | "consume";
  stockName: string;
  quantity: number;
  orderDate?: string;
  estimatedArrivalDate?: string;
  arrivedAt?: string;
  consumedAt?: string;
  relatedOrderId?: string;
  productionRecordId?: string;
  status?: "pending" | "arrived";
  note?: string;
};

type ProductionHistoryRecord = {
  id: string;
  date: string;
  products: Record<string, number>;
  consumedMaterials: Record<string, number>;
  stockAfter: Record<string, number>;
};
```

### 3.2 字段解释

`currentStock`：

- 当前实际库存。
- 不包含运输中库存。
- 允许为负数。

`stockTypes`：

- 所有库存种类配置。
- `incCount` 是购买页点击加号时增加的默认数量。
- `alertDates` 是补货预警天数。
- `arrivalDays` 是预计到货天数。
- 如果 `arrivalDays` 没有配置，则预计到货天数使用 `alertDates`。
- 如果 `alertDates` 也不存在或无效，则使用默认 3 天。

`products`：

- 产品配方。
- key 是产品名称。
- `materials` 表示生产 1 件产品会消耗哪些库存物品以及数量。

`stockHistory`：

- 库存历史流水。
- `purchase_ordered` 表示采购下单，数量为正数，但不加入当前库存。
- `purchase_arrived` 表示采购到货，数量为正数，并加入当前库存。
- `consume` 表示生产消耗，数量为负数，并扣减当前库存。

`productionHistory`：

- 每次提交消耗页后生成一条记录。
- `date` 是生产日期。
- `products` 是当天各产品生产数量。
- `consumedMaterials` 是本次提交实际消耗的库存物品数量，使用正数表示消耗量。
- `stockAfter` 是提交完成后的当前库存快照，不包含运输中库存。

### 3.3 示例 JSON

```json
{
  "currentStock": {
    "贴纸": 300,
    "包装袋": 120,
    "卡片": 500
  },
  "stockTypes": {
    "贴纸": {
      "incCount": 150,
      "alertDates": 3
    },
    "包装袋": {
      "incCount": 100,
      "alertDates": 5,
      "arrivalDays": 3
    },
    "卡片": {
      "incCount": 200,
      "alertDates": 3
    }
  },
  "products": {
    "产品A": {
      "materials": {
        "贴纸": 1,
        "包装袋": 1
      }
    },
    "产品B": {
      "materials": {
        "贴纸": 2,
        "卡片": 1
      }
    }
  },
  "stockHistory": [],
  "productionHistory": []
}
```

## 4. 全局业务规则

### 4.1 日期格式

所有 JSON 日期使用 ISO 日期字符串：

```text
YYYY-MM-DD
```

例如：

```text
2026-06-27
```

页面展示可以使用短日期格式：

```text
6-27
```

### 4.2 当前库存

当前库存只表示已经实际到货、可以使用的库存。

当前库存不包含：

- 已下单但未确认到货的采购订单

当前库存允许为负数。

### 4.3 运输中库存

运输中库存来自 `stockHistory` 中：

- `type = "purchase_ordered"`
- `status = "pending"`

同一物品如果有多个不同预计到达日期，需要分开展示。

例如：

```text
贴纸：300 | 150 (5-1) | 150 (5-2)
```

其中：

- `300` 是当前库存
- `150 (5-1)` 是预计到达日期为 5 月 1 日的在途数量
- `150 (5-2)` 是预计到达日期为 5 月 2 日的在途数量

如果同一物品有多条订单的预计到达日期相同，首页可以合并展示为一项。

### 4.4 预计到达日期

采购提交时，每条采购记录需要生成预计到达日期。

计算规则：

1. 读取该库存物品的 `arrivalDays`。
2. 如果 `arrivalDays` 不存在，则读取 `alertDates`。
3. 如果 `alertDates` 不存在或不是有效正数，则使用 3。
4. `estimatedArrivalDate = orderDate + days`

例如：

- 下单日期：2026-06-27
- 该库存物品配置：`alertDates = 3`
- 预计到达日期：2026-06-30

第一版购买页不需要手动修改预计到达日期。

### 4.5 确认到货

运输中的采购订单不会自动加入当前库存。

必须在待收货页点击确认到货。

确认到货时：

1. 找到对应 `purchase_ordered` 记录。
2. 将该记录的 `status` 改为 `arrived`。
3. 将采购数量加入 `currentStock[stockName]`。
4. 追加一条 `purchase_arrived` 库存历史记录。
5. `purchase_arrived` 记录的 `arrivedAt` 为确认到货当天日期。
6. `purchase_arrived.relatedOrderId` 指向原采购下单记录 id。

### 4.6 最近三天平均损耗

补货判断使用最近三天平均损耗。

定义：

- 使用今天之前的 3 个自然日。
- 不包含今天。
- 没有生产记录的日期按 0 计算。
- 每天损耗根据 `productionHistory.consumedMaterials` 汇总。
- 平均损耗 = 最近三天该库存物品总损耗 / 3。

例如今天是 2026-06-27，则统计：

- 2026-06-24
- 2026-06-25
- 2026-06-26

如果贴纸三天消耗分别为：

- 100
- 0
- 200

则平均损耗：

```text
(100 + 0 + 200) / 3 = 100
```

### 4.7 补货判断

第一版默认不把运输中库存算入补货判断。

需要在代码中保留一个可切换 flag：

```ts
const INCLUDE_IN_TRANSIT_IN_REORDER_CHECK = false;
```

当 flag 为 `false`：

```text
判断库存 = 当前库存
```

当 flag 为 `true`：

```text
判断库存 = 当前库存 + 运输中库存
```

补货规则：

```text
如果 判断库存 < 最近三天平均日损耗 * alertDates
则显示 应购买
否则显示 暂不购买
```

如果最近三天平均损耗为 0，则不显示应购买。

## 5. 页面需求

### 5.1 通用布局

页面顶部需要有导航：

- 首页
- 购买
- 消耗
- 待收货

### 5.2 首页 `/`

首页显示所有库存物品状态。

每种库存物品显示：

- 库存名称
- 当前库存数量
- 运输中数量，按预计到达日期分开展示
- 最近三天平均日损耗
- 补货阈值
- 是否应购买

示例展示：

```text
贴纸
当前库存：300
运输中：150 (预计 5-1), 150 (预计 5-2)
最近三天平均损耗：100 / 天
补货阈值：300
建议：暂不购买
```

运输中为空时显示：

```text
运输中：无
```

应购买状态：

- 如果需要购买，显示 `应购买`
- 如果不需要购买，显示 `暂不购买`

### 5.3 购买页 `/purchase`

购买页列出所有库存种类。

每种库存物品显示：

- 库存名称
- 当前库存
- 默认采购增加数量 `incCount`
- 数量输入框
- 加号按钮
- 减号按钮

初始输入数量为 0。

交互规则：

- 点击 `+`：输入数量增加该库存物品的 `incCount`。
- 点击 `-`：输入数量减少该库存物品的 `incCount`。
- 输入数量最低为 0。
- 允许用户手动输入任意非负整数。
- 提交时忽略数量为 0 的库存物品。
- 如果所有输入都是 0，提交按钮应不可用或提交后提示没有可提交项目。

提交后：

1. 对每个数量大于 0 的库存物品生成一条 `purchase_ordered` 记录。
2. `orderDate` 为当天日期。
3. `estimatedArrivalDate` 按预计到达日期规则计算。
4. `status` 为 `pending`。
5. 不修改 `currentStock`。
6. 提交成功后清空表单。
7. 首页运输中数量立即增加。
8. 待收货页出现对应订单。

### 5.4 消耗页 `/consume`

消耗页展示所有产品。

每个产品显示：

- 产品名称
- 该产品消耗的耗材配方
- 今日生产数量输入框

初始输入数量为 0。

交互规则：

- 允许用户手动输入任意非负整数。
- 提交时忽略数量为 0 的产品。
- 如果所有输入都是 0，提交按钮应不可用或提交后提示没有可提交项目。
- 库存不足时仍然允许提交，当前库存可以变成负数。

提交后：

1. 根据所有产品输入数量计算本次消耗的库存物品总量。
2. 从 `currentStock` 扣除对应库存物品数量。
3. 对每种被消耗的库存物品，追加一条 `consume` 类型库存历史记录。
4. `consume.quantity` 使用负数。
5. 追加一条 `productionHistory` 记录。
6. `productionHistory.products` 保存本次提交的产品生产数量。
7. `productionHistory.consumedMaterials` 保存本次提交的耗材消耗量，使用正数。
8. `productionHistory.stockAfter` 保存扣减后的当前库存快照。
9. 提交成功后清空表单。

### 5.5 待收货页 `/receiving`

待收货页显示所有运输中订单。

订单来源：

- `stockHistory` 中 `type = "purchase_ordered"` 且 `status = "pending"` 的记录。

每条订单显示：

- 库存名称
- 采购数量
- 下单日期
- 预计到达日期
- 是否已超过预计到达日期
- 确认到货按钮

点击确认到货：

1. 执行确认到货业务规则。
2. 页面中移除该待收货订单。
3. 当前库存增加。
4. 首页运输中数量减少。
5. 首页当前库存数量增加。

如果没有待收货订单，显示：

```text
暂无待收货订单
```

## 6. API / 服务端行为

可以使用 Next.js Route Handlers 或 Server Actions。第一版推荐 Route Handlers，逻辑清晰。

### 6.1 读取数据

```text
GET /api/inventory
```

返回完整 `InventoryData`。

### 6.2 提交采购

```text
POST /api/purchase
```

请求体：

```ts
{
  items: Record<string, number>;
}
```

示例：

```json
{
  "items": {
    "贴纸": 300,
    "包装袋": 100
  }
}
```

服务端校验：

- 库存名称必须存在于 `stockTypes`。
- 数量必须是非负整数。
- 忽略数量为 0 的项。
- 至少有一项数量大于 0。

成功后返回更新后的 `InventoryData`。

### 6.3 提交生产消耗

```text
POST /api/consume
```

请求体：

```ts
{
  products: Record<string, number>;
}
```

示例：

```json
{
  "products": {
    "产品A": 100,
    "产品B": 20
  }
}
```

服务端校验：

- 产品名称必须存在于 `products`。
- 数量必须是非负整数。
- 忽略数量为 0 的项。
- 至少有一项数量大于 0。
- 允许库存扣成负数。

成功后返回更新后的 `InventoryData`。

### 6.4 确认到货

```text
POST /api/receiving/confirm
```

请求体：

```ts
{
  orderId: string;
}
```

服务端校验：

- `orderId` 必须对应一条存在的 `purchase_ordered` 记录。
- 该记录 `status` 必须是 `pending`。

成功后返回更新后的 `InventoryData`。

## 7. 派生数据计算

前端或服务端都可以计算派生数据。为了保持页面简单，建议写成共享工具函数。

### 7.1 运输中库存分组

输入：

- `stockHistory`

输出：

```ts
Record<string, Array<{ estimatedArrivalDate: string; quantity: number }>>
```

规则：

- 只统计 `purchase_ordered` 且 `pending` 的记录。
- 按 `stockName` 分组。
- 同一 `stockName` 和同一 `estimatedArrivalDate` 的数量合并。

### 7.2 最近三天损耗

输入：

- `productionHistory`
- `today`

输出：

```ts
Record<string, number>
```

规则：

- 统计今天之前 3 个自然日。
- 没有记录的日期按 0。
- 多条同日生产记录需要合并。
- 返回平均日损耗。

### 7.3 补货建议

输入：

- 当前库存
- 运输中库存
- 最近三天平均损耗
- `alertDates`
- `INCLUDE_IN_TRANSIT_IN_REORDER_CHECK`

输出：

```ts
{
  shouldBuy: boolean;
  threshold: number;
  checkedStock: number;
}
```

规则：

- `threshold = averageDailyConsumption * alertDates`
- 如果 `averageDailyConsumption <= 0`，`shouldBuy = false`
- 如果 flag 为 false，`checkedStock = currentStock`
- 如果 flag 为 true，`checkedStock = currentStock + totalInTransitStock`
- `shouldBuy = checkedStock < threshold`

## 8. 边界情况

- JSON 文件不存在时，系统应创建默认空数据或显示清晰错误。第一版推荐初始化示例数据文件。
- `currentStock` 中缺少某个库存物品时，按 0 处理。
- 产品配方引用不存在的库存物品时，提交消耗应报错。
- 库存数量允许为负数。
- 采购数量、生产数量必须是整数，不能是小数，不能是负数。
- 下单后订单不会自动到货。
- 超过预计到达日期的 pending 订单仍然只显示为待收货，不自动修改库存。
- 同一天可以多次提交生产记录。
- 同一天可以多次提交采购记录。

## 9. 第一版不做的功能

- 登录权限
- 数据库
- 云端部署
- 设置页
- 手动编辑预计到达日期
- 自动到货
- 自动定时任务
- 导入导出
- 图表
- 多仓库
- 删除或编辑历史记录

## 10. 验收标准

完成后系统需要满足：

1. 本地启动 Next.js 后可以访问首页。
2. 首页能展示所有库存物品、当前库存、运输中库存、平均损耗、补货建议。
3. 购买页可以一次提交多个库存物品采购。
4. 采购提交后不会增加当前库存，但会增加运输中数量。
5. 待收货页能看到 pending 订单。
6. 点击确认到货后，当前库存增加，pending 订单消失，并生成到货历史记录。
7. 消耗页可以提交多个产品生产数量。
8. 消耗提交后，系统根据产品配方扣减库存，允许库存为负。
9. 消耗提交后，库存历史记录和产品生产历史记录都正确更新。
10. 最近三天损耗按今天之前三个自然日计算，缺失日期按 0。
11. 补货判断默认不计算运输中库存，但代码中有 flag 可以切换。
12. 所有数据持久保存到本地 JSON 文件。
