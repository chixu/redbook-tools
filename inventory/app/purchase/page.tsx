import { AppShell } from "@/components/AppShell";
import { PurchaseClient } from "@/components/PurchaseClient";
import { readInventoryData } from "@/lib/inventory-store";

export const dynamic = "force-dynamic";

export default async function PurchasePage() {
  const data = await readInventoryData();

  return (
    <AppShell title="购买" eyebrow="下单只生成在途订单">
      <PurchaseClient data={data} />
    </AppShell>
  );
}
