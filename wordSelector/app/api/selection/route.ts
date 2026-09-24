import { NextResponse } from "next/server";
import { describeError, getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "请求来源不匹配。" }, { status: 403 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }
  if (!body || typeof body.key !== "string" || typeof body.selected !== "boolean") {
    return NextResponse.json({ error: "请提供 key 和选中状态。" }, { status: 400 });
  }
  try {
    const selectedKeys = await getStore().select(body.key, body.selected);
    return NextResponse.json({ selectedKeys });
  } catch (error) {
    return NextResponse.json({ error: describeError(error) }, { status: 500 });
  }
}
