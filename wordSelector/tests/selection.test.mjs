import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseTable, sortRows } from "../lib/table.mjs";
import { createFileStore } from "../lib/file-store.mjs";

const text = "\uFEFF单词|词元|备注|词频|考频\r\naaron|aaron||6|3\r\nabbreviation|abbreviate||13|13\r\n\r\n";

test("parses BOM, CRLF, empty cells and trailing blank lines", () => {
  const table = parseTable(text);
  assert.equal(table.headers[0], "单词");
  assert.equal(table.rows.length, 2);
  assert.deepEqual(table.rows[0], { key: "aaron", cells: ["aaron", "aaron", "", "6", "3"] });
});

test("rejects malformed tables and ambiguous keys", () => {
  for (const invalid of ["", "word|\na|b", "word|note\na", "word\na\na", "word\na,b", "word|note\n|note"]) {
    assert.throws(() => parseTable(invalid));
  }
});

test("sorts numbers and words in both directions without mutating source", () => {
  const { rows } = parseTable(text);
  assert.deepEqual(sortRows(rows, 3, "asc").map((row) => row.key), ["aaron", "abbreviation"]);
  assert.deepEqual(sortRows(rows, 3, "desc").map((row) => row.key), ["abbreviation", "aaron"]);
  assert.equal(sortRows(rows, 0, "desc")[0].key, "abbreviation");
  assert.equal(rows[0].key, "aaron");
  const decimals = parseTable("word|count\na|-2\nb|1.5\nc|10\nd|").rows;
  assert.deepEqual(sortRows(decimals, 1, "desc").map((row) => row.key), ["c", "b", "a", "d"]);
});

test("persists, restores, serializes updates and saves empty selections", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "word-selector-"));
  try {
    const file = path.join(dir, "words with spaces.txt");
    const selectionFile = path.join(dir, "words with spaces.selection");
    await writeFile(file, text);
    const store = createFileStore(file);
    assert.deepEqual((await store.load()).selectedKeys, []);
    await Promise.all([store.select("aaron", true), store.select("abbreviation", true)]);
    assert.equal(await readFile(selectionFile, "utf8"), "aaron,abbreviation");
    const restarted = createFileStore(file);
    assert.deepEqual((await restarted.load()).selectedKeys, ["aaron", "abbreviation"]);
    await assert.rejects(restarted.select("missing", true));
    await restarted.select("aaron", false);
    await restarted.select("abbreviation", false);
    assert.equal(await readFile(selectionFile, "utf8"), "");
    assert.equal(await readFile(file, "utf8"), text);
    await writeFile(selectionFile, "missing,aaron");
    assert.deepEqual((await restarted.load()).selectedKeys, ["aaron"]);
  } finally {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith("word-selector-"));
    await rm(dir, { recursive: true, force: true });
  }
});
