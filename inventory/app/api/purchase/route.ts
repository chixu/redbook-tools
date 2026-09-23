import { NextResponse } from "next/server";
import { createPurchaseOrders } from "@/lib/inventory-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await createPurchaseOrders(body.items));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "提交采购失败" },
      { status: 400 },
    );
  }
}
