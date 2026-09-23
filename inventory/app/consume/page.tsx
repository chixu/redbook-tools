import { AppShell } from "@/components/AppShell";
import { ConsumeClient } from "@/components/ConsumeClient";
import { readInventoryData } from "@/lib/inventory-store";

export const dynamic = "force-dynamic";

export default async function ConsumePage() {
  const data = await readInventoryData();

  return (
    <AppShell title="消耗" eyebrow="按产品配方扣减耗材">
      <ConsumeClient data={data} />
    </AppShell>
  );
}
