import { AppShell } from "@/components/AppShell";
import { ReceivingClient } from "@/components/ReceivingClient";
import { readInventoryData } from "@/lib/inventory-store";

export const dynamic = "force-dynamic";

export default async function ReceivingPage() {
  const data = await readInventoryData();

  return (
    <AppShell title="待收货" eyebrow="到货后才写入当前库存">
      <ReceivingClient orders={data.purchaseOrders.filter((order) => order.status === "pending")} />
    </AppShell>
  );
}
