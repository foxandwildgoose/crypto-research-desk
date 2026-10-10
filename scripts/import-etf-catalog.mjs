#!/usr/bin/env node
import { readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { mergeEtfCatalog, normalizeEtfCatalog, summarizeEtfRecords } from "../src/lib/desk/etf.ts";

const path = process.argv[2];
if (!path)
  throw new Error(
    "Usage: node --experimental-strip-types scripts/import-etf-catalog.mjs <reviewed-source-records.json>",
  );
const target = fileURLToPath(new URL("../src/data/etf-catalog.json", import.meta.url));
const previous = normalizeEtfCatalog(JSON.parse(await readFile(target, "utf8")));
const next = normalizeEtfCatalog(JSON.parse(await readFile(path, "utf8")));
const catalog = mergeEtfCatalog(previous, next);
const temporary = `${target}.${process.pid}.tmp`;
await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`, { flag: "wx" });
await rename(temporary, target);
console.log(
  JSON.stringify(
    {
      scope: catalog.scope,
      updatedAt: catalog.updatedAt,
      ...summarizeEtfRecords(catalog.records),
      complete: false,
    },
    null,
    2,
  ),
);
