#!/usr/bin/env node
import { readFile, writeFile, rename, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { normalizeEtfCatalog } from "../src/lib/desk/etf.ts";

export const LISTING_SOURCES = [
  { kind: "nasdaq", url: "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt" },
  { kind: "other", url: "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt" },
];
const CATALOG_PATH = fileURLToPath(new URL("../src/data/etf-catalog.json", import.meta.url));
const EXCLUSIONS_PATH = fileURLToPath(new URL("../src/data/etf-listing-exclusions.json", import.meta.url));
const EXCHANGES = { A: "NYSE American", N: "NYSE", P: "NYSE Arca", Z: "Cboe BZX", V: "IEX" };
const GENERIC_CRYPTO_TITLE = /\b(?:crypto(?:currency|currencies)?|blockchain|staking)\b|\bdigital\s+assets?\b/i;

/** The footer dates the directory snapshot; it is not a launch/approval date. */
export function parseListingDirectory(body, source, now = new Date().toISOString()) {
  if (!LISTING_SOURCES.some((s) => s.kind === source.kind && s.url === source.url))
    throw new Error("Unsupported official listing source");
  const lines = body.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const columns = lines[0]?.split("|");
  const symbolColumn = source.kind === "nasdaq" ? "Symbol" : "ACT Symbol";
  const required = [symbolColumn, "Security Name", "ETF", "Test Issue", ...(source.kind === "other" ? ["Exchange"] : [])];
  if (!columns || required.some((column) => !columns.includes(column)) || new Set(columns).size !== columns.length)
    throw new Error(`Invalid ${source.kind} listing header`);
  const footers = lines.filter((line) => line.startsWith("File Creation Time:"));
  if (footers.length !== 1 || lines.at(-1) !== footers[0]) throw new Error(`Missing or ambiguous ${source.kind} directory date`);
  const date = /^File Creation Time:\s*(\d{2})(\d{2})(\d{4})(\d{2}):(\d{2})\|*$/.exec(footers[0]);
  if (!date) throw new Error(`Invalid ${source.kind} directory date format`);
  const [, month, day, year, hour, minute] = date;
  const asOf = `${year}-${month}-${day}`;
  const instant = Date.parse(`${asOf}T${hour}:${minute}:00Z`);
  if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0, 10) !== asOf || +hour > 23 || +minute > 59 || asOf > now.slice(0, 10))
    throw new Error(`Invalid or future ${source.kind} directory date`);
  const rows = [];
  const seen = new Set();
  for (const line of lines.slice(1, -1)) {
    const fields = line.split("|");
    if (fields.length !== columns.length) throw new Error(`Invalid ${source.kind} listing row width`);
    const row = Object.fromEntries(columns.map((column, index) => [column, fields[index]]));
    if (!["Y", "N"].includes(row.ETF) || !["Y", "N"].includes(row["Test Issue"]))
      throw new Error(`Invalid ${source.kind} ETF/test-issue flag`);
    if (!row[symbolColumn] || !row["Security Name"]) throw new Error(`Missing ${source.kind} product identity`);
    if (row.ETF !== "Y" || row["Test Issue"] !== "N") continue;
    const ticker = row[symbolColumn];
    if (seen.has(ticker)) throw new Error(`Duplicate ${source.kind} ETF ticker: ${ticker}`);
    seen.add(ticker);
    rows.push({
      ticker, productName: row["Security Name"],
      exchange: source.kind === "nasdaq" ? "Nasdaq" : EXCHANGES[row.Exchange] ?? null,
      exchangeCode: source.kind === "nasdaq" ? null : row.Exchange,
      sourceUrl: source.url, asOf, rowExcerpt: line, dateExcerpt: footers[0],
    });
  }
  return { kind: source.kind, sourceUrl: source.url, asOf, dateExcerpt: footers[0], rows };
}

function nameKey(value) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function titleMatches(title, assets) {
  const normalized = ` ${nameKey(title)} `;
  return assets.filter((asset) => [asset.symbol, asset.name].filter(Boolean).some((value) => normalized.includes(` ${nameKey(value)} `)));
}
function listingEvidence(row, now, status) {
  return [
    { url: row.sourceUrl, authority: "exchange", title: "NasdaqTrader official symbol directory: listed ETF row", excerpt: row.rowExcerpt, asOf: row.asOf, verifiedAt: now, status },
    { url: row.sourceUrl, authority: "exchange", title: "NasdaqTrader symbol directory publication timestamp", excerpt: row.dateExcerpt, asOf: row.asOf, verifiedAt: now, status },
  ];
}

/** Existing identities can receive listing evidence; names alone only produce review candidates. */
export function discoverListings(previousInput, directories, exclusionsInput, now = new Date().toISOString()) {
  const previous = normalizeEtfCatalog(previousInput);
  if (previous.scope !== "US") throw new Error("Official US listings require a US-scoped catalog");
  if (!Array.isArray(exclusionsInput) || exclusionsInput.some((e) => !e || typeof e.ticker !== "string" || !e.ticker || typeof e.name !== "string" || typeof e.reason !== "string" || !e.reason))
    throw new Error("Invalid reviewed exchange-directory exclusions");
  if (directories.length !== LISTING_SOURCES.length || LISTING_SOURCES.some((source) => !directories.some((d) => d.kind === source.kind && d.sourceUrl === source.url)))
    throw new Error("Both official listing directories must be parsed before discovery");
  const assets = [...new Map(previous.records.flatMap((record) => record.underlyingAssets).map((asset) => [asset.assetId, asset])).values()];
  const exclusionMap = new Map(exclusionsInput.map((entry) => [entry.ticker.toUpperCase(), entry]));
  const known = new Map();
  for (const record of previous.records) {
    if (record.jurisdiction === "US" && record.ticker && !record.id.startsWith("flow:"))
      known.set(record.ticker, [...(known.get(record.ticker) ?? []), record]);
  }
  const records = [];
  const candidates = [];
  const excluded = [];
  const seen = new Set();
  for (const row of directories.flatMap((directory) => directory.rows)) {
    if (seen.has(row.ticker)) throw new Error(`ETF ticker appears in both official directories: ${row.ticker}`);
    seen.add(row.ticker);
    const exclusion = exclusionMap.get(row.ticker);
    if (exclusion && nameKey(exclusion.name) === nameKey(row.productName)) {
      excluded.push({ ticker: row.ticker, productName: row.productName, reason: exclusion.reason });
      continue;
    }
    const matches = known.get(row.ticker) ?? [];
    if (matches.length === 1) {
      const record = matches[0];
      records.push({
        ...record,
        status: "trading", statusAsOf: row.asOf,
        exchange: record.exchange ?? row.exchange,
        sourceUrl: row.sourceUrl, lastVerifiedAt: now,
        evidence: listingEvidence(row, now, "trading"),
        note: [record.note, "Official dated listing refresh: ETF=Y and Test Issue=N. A listing snapshot does not establish a launch date, approval date, or today's traded price. Absent directory rows do not imply withdrawal."].filter(Boolean).join(" "),
      });
      continue;
    }
    const assetMatches = titleMatches(row.productName, assets);
    if (!matches.length && !assetMatches.length && !GENERIC_CRYPTO_TITLE.test(row.productName)) continue;
    candidates.push({
      record: {
        id: `listing-candidate:US:${row.ticker}`, aliases: [], underlyingAssets: [],
        productName: row.productName, issuer: null, ticker: row.ticker, jurisdiction: "US",
        productType: "unresolved", status: "unverified", statusAsOf: null,
        filingDate: null, approvalDate: null, launchDate: null, deadline: null,
        exchange: row.exchange, regulator: null, filingUrl: null, sourceUrl: row.sourceUrl,
        lastVerifiedAt: null, identifiers: { cik: null, seriesId: null, registrationFile: null },
        evidence: listingEvidence(row, now, null),
        note: "Discovery candidate only. Official listing verifies the ticker and title, but crypto exposure, issuer, underlying constituents, and lifecycle identity require independent review. Not imported into the product catalog.",
      },
      discoveryReason: matches.length > 1 ? "ambiguous_existing_ticker" : assetMatches.length ? "normalized_asset_title_match" : "generic_crypto_title",
      matchedAssets: assetMatches.map((asset) => ({ assetId: asset.assetId, symbol: asset.symbol, name: asset.name })),
      existingRecordIds: matches.map((record) => record.id),
    });
  }
  const envelope = normalizeEtfCatalog({
    schemaVersion: 1, scope: previous.scope, updatedAt: now, complete: false,
    coverageNote: "Dated official US listing evidence for existing reviewed product identities only. Merge with the catalog using the importer; absence is not withdrawal. Newly discovered titles are in the separate unverified candidate report. This is not an exhaustive filing/application universe.",
    records, lastAttemptAt: now, refreshError: null,
  });
  return {
    envelope,
    candidateReport: {
      schemaVersion: 1, generatedAt: now, scope: previous.scope, complete: false,
      methodology: "Existing normalized asset names/symbols plus generic crypto terms discover titles for review. Name matches do not identify underlying exposure. No issuer, product type, or crypto constituent is inferred. Products absent from directories retain their prior catalog state.",
      sources: directories.map(({ kind, sourceUrl, asOf, dateExcerpt, rows }) => ({ kind, sourceUrl, asOf, dateExcerpt, qualifyingEtfRows: rows.length })),
      updatedExistingProducts: envelope.records.length, candidates, excluded,
    },
  };
}

async function fetchDirectory(source, fetcher) {
  const response = await fetcher(source.url, { redirect: "error", signal: AbortSignal.timeout(30000), headers: { accept: "text/plain", "user-agent": "CryptoResearchDesk/1.0" } });
  if (!response.ok || response.redirected) throw new Error(`Official listing request failed: HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Official listing response has no body");
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 8 * 1024 * 1024) throw new Error("Official listing response exceeds 8 MiB");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** No output is touched until both downloads, directory dates and catalog schemas validate. */
export async function runDiscovery({ outputPath, candidatesPath, catalogPath = CATALOG_PATH, exclusionsPath = EXCLUSIONS_PATH, fetcher = fetch, now = new Date().toISOString() }) {
  if (!outputPath) throw new Error("An output JSON path is required");
  const output = resolve(outputPath);
  const report = resolve(candidatesPath ?? output.replace(/(?:\.json)?$/, ".candidates.json"));
  if (output === report || [output, report].includes(resolve(catalogPath))) throw new Error("Discovery outputs must be separate from each other and from the catalog; use the importer after review");
  const [catalog, exclusions] = await Promise.all([readFile(catalogPath, "utf8").then(JSON.parse), readFile(exclusionsPath, "utf8").then(JSON.parse)]);
  normalizeEtfCatalog(catalog);
  const bodies = await Promise.all(LISTING_SOURCES.map((source) => fetchDirectory(source, fetcher)));
  const directories = bodies.map((body, index) => parseListingDirectory(body, LISTING_SOURCES[index], now));
  const result = discoverListings(catalog, directories, exclusions, now);
  const pairs = [[output, result.envelope], [report, result.candidateReport]];
  const temporary = pairs.map(([path]) => `${path}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await Promise.all(pairs.map(async ([path, value], index) => {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(temporary[index], `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
    }));
    for (let index = 0; index < pairs.length; index++) await rename(temporary[index], pairs[index][0]);
  } finally {
    await Promise.all(temporary.map((path) => rm(path, { force: true })));
  }
  return { outputPath: output, candidatesPath: report, ...result };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [outputPath, ...args] = process.argv.slice(2);
  const options = { outputPath };
  const flags = { "--candidates": "candidatesPath", "--catalog": "catalogPath", "--exclusions": "exclusionsPath" };
  try {
    for (let index = 0; index < args.length; index += 2) {
      const option = flags[args[index]];
      if (!option || !args[index + 1]) throw new Error(`Invalid option: ${args[index]}`);
      options[option] = args[index + 1];
    }
    if (!outputPath) throw new Error("Usage: node --use-env-proxy --experimental-strip-types scripts/discover-etf-listings.mjs <output.json> [--candidates <report.json>] [--catalog <catalog.json>] [--exclusions <reviewed-exclusions.json>]");
    const result = await runDiscovery(options);
    console.log(JSON.stringify({ outputPath: result.outputPath, candidatesPath: result.candidatesPath, updatedExistingProducts: result.envelope.records.length, candidates: result.candidateReport.candidates.length, excluded: result.candidateReport.excluded.length, sources: result.candidateReport.sources, complete: false }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
