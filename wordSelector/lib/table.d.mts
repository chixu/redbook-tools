export type WordRow = { key: string; cells: string[] };
export type WordTable = { headers: string[]; rows: WordRow[] };
export function parseTable(text: string): WordTable;
export function sortRows(rows: WordRow[], column: number, direction: "asc" | "desc"): WordRow[];
