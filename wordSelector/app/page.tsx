import { getStore, describeError } from "@/lib/store";
import WordTable from "@/components/WordTable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  try {
    const data = await getStore().load();
    return <WordTable data={data} />;
  } catch (error) {
    return <main className="workspace"><p className="eyebrow">WORD SELECTOR</p><h1>无法加载词表</h1>
      <div className="error" role="alert">{describeError(error)}</div>
      <p>修正文件后刷新页面。TXT 应使用 UTF-8 编码，第一行为表头，每列用 | 分隔。</p>
      <a className="reload" href="/">重新加载</a></main>;
  }
}
