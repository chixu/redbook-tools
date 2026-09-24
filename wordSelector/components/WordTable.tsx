"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WordData } from "@/lib/file-store.mjs";
import { sortRows } from "@/lib/table.mjs";

export default function WordTable({ data }: { data: WordData }) {
  const [selected, setSelected] = useState(() => new Set(data.selectedKeys));
  const [sort, setSort] = useState<{ column: number; direction: "asc" | "desc" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("选择已恢复，修改后自动保存");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(300);
  const [pageSizeInput, setPageSizeInput] = useState("300");
  const [page, setPage] = useState(1);
  const rows = useMemo(() => sort ? sortRows(data.rows, sort.column, sort.direction) : data.rows, [data.rows, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(start, start + pageSize);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("wordSelector.pageSize"));
      if (Number.isInteger(saved) && saved >= 1 && saved <= 10000) {
        setPageSize(saved);
        setPageSizeInput(String(saved));
      }
    } catch { /* 浏览器禁用存储时仍可使用分页。 */ }
  }, []);

  useEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0;
  }, [currentPage, pageSize, sort]);

  async function toggle(key: string) {
    if (busy.current) return;
    busy.current = true;
    const previous = selected;
    const next = new Set(previous);
    const checked = !next.has(key);
    if (checked) next.add(key); else next.delete(key);
    setSelected(next);
    setSaving(true);
    setError("");
    setMessage("正在保存…");
    try {
      const response = await fetch("/api/selection", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, selected: checked }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败，请重试。");
      setSelected(new Set<string>(result.selectedKeys));
      setMessage("已保存到选择文件");
    } catch (failure) {
      setSelected(previous);
      setMessage("保存未确认");
      setError(`${failure instanceof Error ? failure.message : "保存失败"} 请刷新确认已保存状态后重试。`);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return <main className="workspace">
    <header className="pageHeader"><div><p className="eyebrow">WORD SELECTOR</p><h1>单词挑选</h1>
      <p className="fileName" title={data.fileName}>{data.fileName}</p></div>
      <div className="count"><strong>{selected.size}</strong><span>已选 / {data.rows.length} 个单词</span></div>
    </header>
    <div className="toolbar"><p id="table-help">点击行或勾选框选择 · 点击列名切换排序</p>
      <span role="status" aria-live="polite" className="saveStatus">{message}</span></div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="pagination">
      <form className="pageSizeForm" onSubmit={(event) => {
        event.preventDefault();
        const size = Number(pageSizeInput);
        if (!Number.isInteger(size) || size < 1 || size > 10000) return;
        setPageSize(size);
        setPage(1);
        try { localStorage.setItem("wordSelector.pageSize", String(size)); } catch { /* 可选偏好存储。 */ }
      }}>
        <label htmlFor="page-size">每页行数</label>
        <input id="page-size" type="number" min="1" max="10000" step="1" required
          value={pageSizeInput} onChange={(event) => setPageSizeInput(event.target.value)} />
        <button type="submit">应用</button>
      </form>
      <span className="pageRange" role="status">第 {rows.length ? start + 1 : 0}–{Math.min(start + pageSize, rows.length)} 行，共 {rows.length} 行</span>
      <nav className="pageNavigation" aria-label="词表分页">
        <button disabled={currentPage === 1} onClick={() => setPage(1)}>首页</button>
        <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</button>
        <label className="pagePicker">第 <select aria-label="跳转到页" value={currentPage}
          onChange={(event) => setPage(Number(event.target.value))}>
          {Array.from({ length: pageCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select> / {pageCount} 页</label>
        <button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>下一页</button>
        <button disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}>末页</button>
      </nav>
    </div>
    <div ref={viewport} className="tableViewport" tabIndex={0} role="region" aria-label="单词表，可横向滚动">
      <table aria-describedby="table-help" aria-busy={saving}>
        <caption className="srOnly">{data.fileName} 单词选择表</caption>
        <thead><tr><th scope="col" className="checkboxCell"><span className="srOnly">选择</span></th>
          {data.headers.map((header, index) => <th scope="col" key={index}
            aria-sort={sort?.column === index ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>
            <button onClick={() => {
              setSort({ column: index, direction: sort?.column === index && sort.direction === "asc" ? "desc" : "asc" });
              setPage(1);
            }}>
              {header}<span aria-hidden="true" className="sortArrow">{sort?.column === index ? sort.direction === "asc" ? "↑" : "↓" : "↕"}</span>
            </button></th>)}
        </tr></thead>
        <tbody>{visibleRows.map((row) => <tr key={row.key} className={selected.has(row.key) ? "selected" : ""}
          onClick={() => void toggle(row.key)}>
          <td className="checkboxCell"><input type="checkbox" aria-label={`选择 ${row.key}`} checked={selected.has(row.key)}
            disabled={saving} onClick={(event) => event.stopPropagation()} onChange={() => void toggle(row.key)} /></td>
          {row.cells.map((cell, index) => <td key={index} className={index === 0 ? "wordCell" : ""}>{cell}</td>)}
        </tr>)}</tbody>
      </table>
      {rows.length === 0 && <p className="empty">词表暂无单词。请在 TXT 表头后添加数据，再刷新页面。</p>}
    </div>
    <footer>选择自动保存至 <code>{data.selectionFileName}</code>，下次打开继续挑选。</footer>
  </main>;
}
