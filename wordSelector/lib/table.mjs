export function parseTable(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  const headers = lines[0].split("|").map((value) => value.trim());
  if (headers.some((header) => !header)) throw new Error("第一行必须包含非空的表头，用 | 分隔。");
  const keys = new Set();
  const rows = [];
  for (let index = 1; index < lines.length; index++) {
    if (!lines[index].trim()) continue;
    const cells = lines[index].split("|").map((value) => value.trim());
    if (cells.length !== headers.length) throw new Error(`第 ${index + 1} 行的列数与表头不一致。`);
    const key = cells[0];
    if (!key || key.includes(",")) throw new Error(`第 ${index + 1} 行的 key 不能为空或包含逗号。`);
    if (keys.has(key)) throw new Error(`第 ${index + 1} 行有重复 key：${key}`);
    keys.add(key);
    rows.push({ key, cells });
  }
  return { headers, rows };
}

const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });

export function sortRows(rows, column, direction) {
  const numeric = rows.some((row) => row.cells[column] !== "") &&
    rows.every((row) => row.cells[column] === "" || Number.isFinite(Number(row.cells[column])));
  return [...rows].sort((a, b) => {
    const left = a.cells[column];
    const right = b.cells[column];
    // 空值无论升降序都排在最后。
    if (left === "" || right === "") return left === right ? 0 : left === "" ? 1 : -1;
    const result = numeric ? Number(left) - Number(right) : collator.compare(left, right);
    return direction === "asc" ? result : -result;
  });
}
