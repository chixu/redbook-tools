import { NextResponse } from "next/server";
import { readInventoryData } from "@/lib/inventory-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readInventoryData());
}
