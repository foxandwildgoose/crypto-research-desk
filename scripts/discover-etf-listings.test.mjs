import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LISTING_SOURCES, discoverListings, parseListingDirectory, runDiscovery } from "./discover-etf-listings.mjs";
import { mergeEtfCatalog } from "../src/lib/desk/etf.ts";

const NOW = "2026-10-10T12:00:00Z";
const DATE = "File Creation Time: 1009202621:31";
const NASDAQ_HEADER = "Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares";
const OTHER_HEADER = "ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol";

function body(kind, rows, date = DATE) {
  return [kind === "nasdaq" ? NASDAQ_HEADER : OTHER_HEADER, ...rows, `${date}${kind === "nasdaq" ? "|||||||" : "||||||"}`].join("\r\n");
}
function nasdaqRow(ticker, name, etf = "Y", testIssue = "N") {
  return `${ticker}|${name}|G|${testIssue}|N|100|${etf}|N`;
}
function otherRow(ticker, name, etf = "Y", testIssue = "N") {
  return `${ticker}|${name}|P|${ticker}|${etf}|100|${testIssue}|${ticker}`;
}
function catalog(records) {
  return { schemaVersion: 1, scope: "US", updatedAt: null, complete: false, coverageNote: "Synthetic discovery test catalog.", records, lastAttemptAt: null, refreshError: null };
}
function record(id, ticker, overrides = {}) {
  return {
    id, aliases: [], underlyingAssets: [{ assetId: "newcoin", symbol: "NEWCOIN", name: "Synthetic New Coin", weightPct: null }],
    productName: "Synthetic reviewed New Coin Fund", issuer: "Synthetic verified issuer", ticker,
    jurisdiction: "US", productType: "futures", status: "unverified", statusAsOf: null,
    filingDate: "2026-09-01", approvalDate: null, launchDate: null, deadline: null,
    exchange: "Nasdaq", regulator: null, filingUrl: null, sourceUrl: "https://example.test/synthetic-reviewed",
    lastVerifiedAt: null, identifiers: { cik: "0000123456", seriesId: "S000000123", registrationFile: null }, evidence: [], note: "Synthetic reviewed product fixture.", ...overrides,
  };
}
function parsed(nasdaqRows, otherRows = []) {
  return [parseListingDirectory(body("nasdaq", nasdaqRows), LISTING_SOURCES[0], NOW), parseListingDirectory(body("other", otherRows), LISTING_SOURCES[1], NOW)];
}

test("listing parser keeps only real ETF issues and retains exact dated source excerpts", () => {
  const officialRow = nasdaqRow("TSTETF", "Synthetic New Coin Fund");
  const result = parseListingDirectory(body("nasdaq", [officialRow, nasdaqRow("TSTTEST", "Synthetic test issue", "Y", "Y"), nasdaqRow("TSTEQUITY", "Synthetic stock", "N")]), LISTING_SOURCES[0], NOW);
  assert.equal(result.rows.length, 1);
  assert.equal(result.asOf, "2026-10-09");
  assert.equal(result.rows[0].ticker, "TSTETF");
  assert.equal(result.rows[0].rowExcerpt, officialRow);
  assert.equal(result.rows[0].dateExcerpt, `${DATE}|||||||`);
});

test("missing, invalid and future directory dates or changed row/header schemas fail", () => {
  const row = nasdaqRow("TSTETF", "Synthetic New Coin Fund");
  for (const invalid of [
    `${NASDAQ_HEADER}\n${row}`,
    body("nasdaq", [row], "File Creation Time: 0230202621:31"),
    body("nasdaq", [row], "File Creation Time: 1011202621:31"),
    body("nasdaq", [row], "File Creation Time: 1009202625:31"),
    body("nasdaq", [row, row]),
    body("nasdaq", ["wrong|width"]),
    body("nasdaq", [row]).replace("|ETF|", "|Unexpected Flag|"),
  ]) {
    assert.throws(() => parseListingDirectory(invalid, LISTING_SOURCES[0], NOW));
  }
});

test("dynamic asset names discover candidates without inferring issuer, underlying or exposure", () => {
  const existing = catalog([record("synthetic-reviewed", "TSTKNOWN")]);
  const result = discoverListings(existing, parsed([], [otherRow("TSTFRESH", "Synthetic NEWCOIN 2x Bull ETF"), otherRow("TSTGENERIC", "Synthetic Cryptocurrency Opportunity ETF"), otherRow("TSTUNRELATED", "Synthetic Equity Market ETF")]), [], NOW);
  assert.equal(result.envelope.records.length, 0);
  assert.equal(result.candidateReport.candidates.length, 2);
  const candidate = result.candidateReport.candidates.find((item) => item.record.ticker === "TSTFRESH");
  assert.equal(candidate.discoveryReason, "normalized_asset_title_match");
  assert.deepEqual(candidate.matchedAssets.map((asset) => asset.symbol), ["NEWCOIN"]);
  for (const item of result.candidateReport.candidates) {
    assert.deepEqual(item.record.underlyingAssets, []);
    assert.equal(item.record.issuer, null);
    assert.equal(item.record.productType, "unresolved");
    assert.equal(item.record.status, "unverified");
    assert.equal(item.record.lastVerifiedAt, null);
    assert.ok(item.record.evidence.every((evidence) => evidence.status === null));
  }
});

test("known products receive dated listing status while identity and enrichment remain intact", () => {
  const known = record("synthetic-reviewed", "TSTKNOWN");
  const missing = record("synthetic-absent", "TSTABSENT", { identifiers: { cik: null, seriesId: null, registrationFile: null }, productName: "Synthetic absent fund" });
  const previous = catalog([known, missing]);
  const original = structuredClone(previous);
  const result = discoverListings(previous, parsed([nasdaqRow(known.ticker, "Official synthetic renamed listing")]), [], NOW);
  assert.equal(result.envelope.records.length, 1);
  const updated = result.envelope.records[0];
  assert.equal(updated.id, known.id);
  assert.equal(updated.productName, known.productName);
  assert.equal(updated.issuer, known.issuer);
  assert.equal(updated.productType, "futures");
  assert.deepEqual(updated.identifiers, known.identifiers);
  assert.deepEqual(updated.underlyingAssets, known.underlyingAssets);
  assert.equal(updated.filingDate, known.filingDate);
  assert.equal(updated.status, "trading");
  assert.equal(updated.statusAsOf, "2026-10-09");
  assert.equal(updated.launchDate, null);
  assert.equal(updated.evidence.length, 2);
  assert.equal(updated.lastVerifiedAt, NOW);
  const merged = mergeEtfCatalog(previous, result.envelope);
  assert.equal(merged.records.find((row) => row.id === missing.id)?.status, "unverified", "absence is not a withdrawal");
  assert.deepEqual(previous, original);
});

test("reviewed exclusions require matching ticker and product identity, not a permanent ticker ban", () => {
  const exclusions = [{ ticker: "TSTEXCLUDED", name: "Synthetic Crypto Equity ETF", reason: "Synthetic reviewed corporate equity exclusion" }];
  const existing = catalog([record("synthetic-reviewed", "TSTKNOWN")]);
  const excluded = discoverListings(existing, parsed([nasdaqRow("TSTEXCLUDED", exclusions[0].name)]), exclusions, NOW);
  assert.equal(excluded.candidateReport.candidates.length, 0);
  assert.equal(excluded.candidateReport.excluded.length, 1);
  const renamed = discoverListings(existing, parsed([nasdaqRow("TSTEXCLUDED", "Synthetic NEWCOIN Fund")]), exclusions, NOW);
  assert.equal(renamed.candidateReport.candidates.length, 1);
});

test("ambiguous existing product tickers require review instead of upgrading both products", () => {
  const first = record("synthetic-ambiguous-one", "TSTDUPE");
  const second = record("synthetic-ambiguous-two", "TSTDUPE", { productName: "Synthetic other fund", exchange: null, identifiers: { cik: "987654", seriesId: "S000000124", registrationFile: null } });
  const result = discoverListings(catalog([first, second]), parsed([nasdaqRow("TSTDUPE", "Synthetic New Coin Fund")]), [], NOW);
  assert.equal(result.envelope.records.length, 0);
  assert.equal(result.candidateReport.candidates[0].discoveryReason, "ambiguous_existing_ticker");
});

test("failed second download or invalid directory date leaves both existing output files untouched", async () => {
  const directory = await mkdtemp(join(tmpdir(), "etf-discovery-test-"));
  try {
    const catalogPath = join(directory, "catalog.json");
    const exclusionsPath = join(directory, "exclusions.json");
    const outputPath = join(directory, "output.json");
    const candidatesPath = join(directory, "candidates.json");
    await writeFile(catalogPath, JSON.stringify(catalog([record("synthetic-reviewed", "TSTKNOWN")])));
    await writeFile(exclusionsPath, "[]");
    await writeFile(outputPath, "saved reviewed output");
    await writeFile(candidatesPath, "saved review candidates");
    for (const failure of ["network", "date"]) {
      const fetcher = async (url, init) => {
        assert.equal(init.redirect, "error");
        if (url === LISTING_SOURCES[0].url) return new Response(body("nasdaq", [nasdaqRow("TSTKNOWN", "Synthetic New Coin Fund")]));
        if (failure === "network") throw new TypeError("Synthetic second directory failure");
        return new Response(body("other", [], "File Creation Time: invalid"));
      };
      await assert.rejects(runDiscovery({ outputPath, candidatesPath, catalogPath, exclusionsPath, fetcher, now: NOW }));
      assert.equal(await readFile(outputPath, "utf8"), "saved reviewed output");
      assert.equal(await readFile(candidatesPath, "utf8"), "saved review candidates");
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
