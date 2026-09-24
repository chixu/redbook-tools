import type { WordTable } from "./table.mjs";
export type WordData = WordTable & { fileName: string; selectionFileName: string; selectedKeys: string[] };
export function createFileStore(filePath: string): {
  load(): Promise<WordData>;
  select(key: string, selected: boolean): Promise<string[]>;
};
