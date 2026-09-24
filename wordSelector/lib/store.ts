import { createFileStore } from "./file-store.mjs";

type Store = ReturnType<typeof createFileStore>;
const state = globalThis as typeof globalThis & { wordSelectorStores?: Map<string, Store> };

export function getStore(): Store {
  const filePath = process.env.WORD_SELECTOR_FILE;
  if (!filePath) throw new Error("请使用 npm run dev -- wordSelector <filepath.txt> 启动项目。");
  const stores = state.wordSelectorStores ??= new Map();
  if (!stores.has(filePath)) stores.set(filePath, createFileStore(filePath));
  return stores.get(filePath)!;
}

export function describeError(error: unknown): string {
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code === "ENOENT") return "找不到源文件，请检查启动时传入的路径。";
  if (code === "EACCES" || code === "EPERM") return "文件访问失败，请检查源文件和所在目录的读写权限。";
  return error instanceof Error ? error.message : "文件处理失败，请重试。";
}
