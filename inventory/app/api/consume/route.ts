import { NextResponse } from "next/server";
import { consumeProducts } from "@/lib/inventory-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await consumeProducts(body.products));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "提交消耗失败" },
      { status: 400 },
    );
  }
}
