import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseTable } from "./table.mjs";

export function createFileStore(filePath) {
  const selectionPath = path.join(path.dirname(filePath), `${path.basename(filePath, path.extname(filePath))}.selection`);
  let writes = Promise.resolve();

  async function load() {
    const table = parseTable(await readFile(filePath, "utf8"));
    let saved = "";
    try {
      saved = await readFile(selectionPath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const selected = new Set(saved.replace(/^\uFEFF/, "").split(",").map((key) => key.trim()));
    return {
      ...table,
      fileName: path.basename(filePath),
      selectionFileName: path.basename(selectionPath),
      selectedKeys: table.rows.filter((row) => selected.has(row.key)).map((row) => row.key),
    };
  }

  function select(key, selected) {
    const operation = writes.then(async () => {
      const data = await load();
      if (!data.rows.some((row) => row.key === key)) throw new Error("该单词已不在文件中，请刷新页面。");
      const keys = new Set(data.selectedKeys);
      if (selected) keys.add(key);
      else keys.delete(key);
      const selectedKeys = data.rows.filter((row) => keys.has(row.key)).map((row) => row.key);
      const temporaryPath = `${selectionPath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporaryPath, selectedKeys.join(","), { encoding: "utf8", flag: "wx" });
        await rename(temporaryPath, selectionPath);
      } finally {
        await unlink(temporaryPath).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
      return selectedKeys;
    });
    // 顺序处理每个 key 的更新，避免并发请求覆盖其他行的选择。
    writes = operation.catch(() => {});
    return operation;
  }

  return { load, select };
}
