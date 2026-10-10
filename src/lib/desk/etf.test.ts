import assert from "node:assert/strict";
import test from "node:test";
import {
  assetEtfRecords,
  dedupeEtfRecords,
  etfSection,
  filterEtfRecords,
  groupEtfRecords,
  mergeEtfCatalog,
  normalizeEtfCatalog,
  recordsFromFlows,
  summarizeEtfRecords,
} from "./etf.ts";
import type { Asset, CryptoEtfRecord, CryptoEtfStatus, EtfCatalog, EtfProduct, EtfUnderlying } from "./types.ts";

// These are explicitly synthetic test records, never imported by runtime code.
const VERIFIED_AT = "2026-10-10T00:00:00Z";
const STATUS_DATE = "2026-10-09";

function underlying(symbol: string, name: string | null = `Synthetic asset ${symbol}`): EtfUnderlying {
  return { assetId: symbol.toLowerCase(), symbol, name, weightPct: null };
}

function record(id: string, symbol = "BTC", status: CryptoEtfStatus = "trading", overrides: Partial<CryptoEtfRecord> = {}): CryptoEtfRecord {
  const statusAsOf = overrides.statusAsOf ?? STATUS_DATE;
  return {
    id,
    aliases: [],
    underlyingAssets: [underlying(symbol)],
    productName: `Synthetic ${id} ETF`,
    issuer: `Synthetic ${id} issuer`,
    ticker: null,
    jurisdiction: "US",
    productType: "spot",
    status,
    statusAsOf,
    filingDate: null,
    approvalDate: null,
    launchDate: null,
    deadline: null,
    exchange: null,
    regulator: null,
    filingUrl: null,
    sourceUrl: `https://example.test/synthetic/${id}`,
    lastVerifiedAt: status === "unverified" ? null : VERIFIED_AT,
    identifiers: { cik: null, seriesId: null, registrationFile: null },
    evidence: status === "unverified" ? [] : [{
      url: `https://example.test/synthetic/${id}`,
      authority: "regulator",
      title: "Synthetic test status evidence",
      excerpt: `Synthetic fixture explicitly records status ${status}.`,
      asOf: statusAsOf,
      verifiedAt: VERIFIED_AT,
      status,
    }],
    note: "Synthetic test fixture; not investment data.",
    ...overrides,
  };
}

function catalog(records: CryptoEtfRecord[], overrides: Partial<EtfCatalog> = {}): EtfCatalog {
  return {
    schemaVersion: 1,
    scope: "Synthetic test market",
    updatedAt: VERIFIED_AT,
    complete: false,
    coverageNote: "Synthetic test catalog; no completeness claim.",
    records,
    lastAttemptAt: null,
    refreshError: null,
    ...overrides,
  };
}

test("ETF sections retain every lifecycle status and keep historical and unverified records separate", () => {
  const sections: Record<CryptoEtfStatus, string> = {
    approved: "approved",
    approved_not_launched: "approved",
    launched: "approved",
    trading: "approved",
    filed: "applications",
    acknowledged: "applications",
    under_review: "applications",
    amended: "applications",
    delayed: "applications",
    withdrawn: "historical",
    rejected: "historical",
    delisting_filed: "historical",
    unverified: "unverified",
  };
  for (const [status, section] of Object.entries(sections)) {
    assert.equal(etfSection(record(`status-${status}`, "ABC", status as CryptoEtfStatus)), section, status);
  }
});

test("ETF groups discover the original four assets and any additional asset from records", () => {
  const symbols = ["BTC", "ETH", "XRP", "SOL", "DOGE", "LTC", "ABC"];
  const rows = symbols.map((symbol, index) => record(`dynamic-${symbol}`, symbol, index % 2 ? "filed" : "trading"));
  assert.deepEqual(groupEtfRecords(rows).map((group) => group.symbol).sort(), [...symbols].sort());
  const future = record("dynamic-newcoin", "NEWCOIN", "under_review");
  const groups = groupEtfRecords([...rows, future]);
  assert.ok(groups.some((group) => group.symbol === "NEWCOIN" && group.records[0].id === future.id));
  assert.equal(groups.length, symbols.length + 1);
  for (const symbol of symbols) {
    assert.equal(assetEtfRecords(rows, symbol.toLowerCase()).length, 1, `${symbol} detail remains available`);
  }
});

test("summary and per-asset counts derive from deduplicated lifecycle records", () => {
  const btc = record("count-btc", "BTC", "trading");
  const rows = [btc, { ...btc }, record("count-btc-2", "BTC", "approved_not_launched"),
    record("count-ltc", "LTC", "approved"), record("count-doge", "DOGE", "filed"),
    record("count-doge-2", "DOGE", "delayed"), record("count-btc-filed", "BTC", "under_review"),
    record("count-old", "ABC", "withdrawn"), record("count-unknown", "SOL", "unverified")];
  assert.deepEqual(summarizeEtfRecords(rows), {
    approvedAssets: 2,
    approvedProducts: 3,
    applicationAssets: 2,
    applications: 3,
    historical: 1,
    unverified: 1,
  });
  const groups = groupEtfRecords(rows);
  assert.equal(groups[0].symbol, "BTC", "most approved products sorts first");
  const btcGroup = groups.find((group) => group.symbol === "BTC");
  assert.equal(btcGroup?.approvedCount, 2);
  assert.equal(btcGroup?.applicationCount, 1);
  assert.equal(btcGroup?.records.length, 3);
});

test("asset ordering uses application counts and alphabetical symbols after approved counts", () => {
  const rows = [record("sort-z", "ZZZ", "filed"), record("sort-a", "AAA", "filed"),
    record("sort-m", "MMM", "filed"), record("sort-m-2", "MMM", "under_review")];
  assert.deepEqual(groupEtfRecords(rows).map((group) => group.symbol), ["MMM", "AAA", "ZZZ"]);
});

test("same-id and alias discoveries collapse into one ETF product", () => {
  const original = record("identity-original", "DOGE", "filed");
  const viaAnotherSource = { ...original, id: "identity-new-source", aliases: [original.id], sourceUrl: "https://example.test/synthetic/other-source" };
  const rows = dedupeEtfRecords([original, { ...original }, viaAnotherSource]);
  assert.equal(rows.length, 1);
  const ids = [rows[0].id, ...rows[0].aliases];
  assert.ok(ids.includes(original.id));
  assert.ok(ids.includes(viaAnotherSource.id));
});

test("distinct non-Latin product and issuer names do not collapse to an empty identity", () => {
  const first = record("nonlatin-one", "ABC", "filed", { issuer: "가상 첫 운용사", productName: "가상 상품 하나" });
  const second = record("nonlatin-two", "ABC", "filed", { issuer: "가상 둘 운용사", productName: "가상 상품 둘" });
  assert.equal(dedupeEtfRecords([first, second]).length, 2);
  assert.equal(dedupeEtfRecords([first, { ...first, id: "nonlatin-one-other-source" }]).length, 1);
});

test("regulatory series identities deduplicate different discovery names", () => {
  const first = record("series-first", "ABC", "filed", {
    identifiers: { cik: "0000123456", seriesId: "S000000123", registrationFile: null },
  });
  const second = record("series-second", "ABC", "filed", {
    productName: "Synthetic renamed application",
    identifiers: { cik: "123456", seriesId: "S000000123", registrationFile: null },
  });
  assert.equal(dedupeEtfRecords([first, second]).length, 1);
  const differentSeries = { ...second, id: "series-third", identifiers: { ...second.identifiers, seriesId: "S000000124" } };
  assert.equal(dedupeEtfRecords([first, differentSeries]).length, 2);
});

test("separate regulatory series remain distinct within the same registration file", () => {
  const first = record("registration-series-one", "ABC", "filed", {
    issuer: "Synthetic shared issuer",
    identifiers: { cik: "123456", seriesId: "S000000123", registrationFile: "333-123456" },
  });
  const second = record("registration-series-two", "ABC", "filed", {
    issuer: first.issuer,
    identifiers: { cik: "123456", seriesId: "S000000124", registrationFile: "333-123456" },
  });
  assert.equal(dedupeEtfRecords([first, second]).length, 2, "one registration may contain multiple distinct ETF series");
});

test("ticker deduplication includes exchange, jurisdiction, underlying and exposure type", () => {
  const base = record("ticker-base", "BTC", "trading", { ticker: "SYN", exchange: "Synthetic Exchange" });
  const duplicate = { ...base, id: "ticker-other-source" };
  assert.equal(dedupeEtfRecords([base, duplicate]).length, 1);
  const distinct = [
    { ...base, id: "ticker-other-exchange", productName: "Synthetic other exchange fund", exchange: "Other Synthetic Exchange" },
    { ...base, id: "ticker-other-country", productName: "Synthetic other country fund", jurisdiction: "CA" },
    { ...base, id: "ticker-other-asset", productName: "Synthetic other asset fund", underlyingAssets: [underlying("ETH")] },
    { ...base, id: "ticker-other-type", productName: "Synthetic other type fund", productType: "futures" as const },
  ];
  assert.equal(dedupeEtfRecords([base, ...distinct]).length, 5);
  assert.equal(dedupeEtfRecords([
    { ...base, id: "missing-exchange-one", productName: null, exchange: null },
    { ...base, id: "missing-exchange-two", productName: null, exchange: null },
  ]).length, 2, "an incomplete ticker identity must not merge unrelated products");
});

test("newer withdrawal or trading evidence supersedes an older active filing", () => {
  const filed = record("chronology", "ABC", "filed", { statusAsOf: "2026-09-01", filingDate: "2026-09-01" });
  for (const status of ["withdrawn", "trading"] as const) {
    const latest = record("chronology", "ABC", status, { statusAsOf: "2026-10-01" });
    for (const order of [[filed, latest], [latest, filed]]) {
      const merged = dedupeEtfRecords(order);
      assert.equal(merged.length, 1);
      assert.equal(merged[0].status, status);
      assert.equal(merged[0].statusAsOf, "2026-10-01");
      assert.equal(merged[0].filingDate, "2026-09-01");
      assert.equal(etfSection(merged[0]), status === "withdrawn" ? "historical" : "approved");
    }
  }
});

test("a newer delisting filing supersedes trading while retaining its distinct historical status", () => {
  const trading = record("synthetic-delisting-notice", "ABC", "trading", { statusAsOf: "2026-09-01" });
  const notice = record("synthetic-delisting-notice", "ABC", "delisting_filed", { statusAsOf: "2026-10-09" });
  for (const rows of [[trading, notice], [notice, trading]]) {
    const result = dedupeEtfRecords(rows);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, "delisting_filed", "a filed notice does not assert effective withdrawal or liquidation");
    assert.equal(result[0].statusAsOf, "2026-10-09");
    assert.equal(etfSection(result[0]), "historical");
    assert.equal(filterEtfRecords(result, { section: "approved" }).length, 0);
    assert.equal(filterEtfRecords(result, { section: "applications" }).length, 0);
    assert.equal(summarizeEtfRecords(result).historical, 1);
    assert.equal(summarizeEtfRecords(result).approvedProducts, 0);
    assert.equal(summarizeEtfRecords(result).applications, 0);
  }
});

test("contradictory verified status reports for the same date remain unverified", () => {
  const filed = record("conflict", "ABC", "filed");
  const withdrawn = record("conflict", "ABC", "withdrawn");
  for (const order of [[filed, withdrawn], [withdrawn, filed]]) {
    const result = dedupeEtfRecords(order);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, "unverified");
    assert.equal(etfSection(result[0]), "unverified");
    assert.equal(result[0].evidence.length, 2, "both contradictory sources remain inspectable");
  }
});

test("repeated refreshes cannot erase a status conflict without newer primary evidence", () => {
  const filed = record("retained-conflict", "ABC", "filed", { statusAsOf: "2026-10-01" });
  const withdrawn = record("retained-conflict", "ABC", "withdrawn", { statusAsOf: "2026-10-01" });
  const conflict = dedupeEtfRecords([filed, withdrawn]);
  const repeated = dedupeEtfRecords([...conflict, filed]);
  assert.equal(repeated[0].status, "unverified", "repeating one disputed source does not resolve the conflict");
  assert.equal(repeated[0].evidence.length, 2);
  const resolved = dedupeEtfRecords([...repeated, record("retained-conflict", "ABC", "withdrawn", { statusAsOf: "2026-10-09" })]);
  assert.equal(resolved[0].status, "withdrawn", "newer primary status can resolve older conflicts");
  assert.equal(resolved[0].statusAsOf, "2026-10-09");
});

test("basket ETFs have a separate group and never masquerade as single-asset ETFs", () => {
  const basket = record("synthetic-basket", "BTC", "trading", {
    productType: "basket",
    underlyingAssets: [{ ...underlying("BTC"), weightPct: 60 }, { ...underlying("ETH"), weightPct: 40 }],
  });
  const basketOnly = groupEtfRecords([basket]);
  assert.equal(basketOnly.length, 1);
  assert.equal(basketOnly[0].records[0].id, basket.id);
  assert.ok(!["BTC", "ETH"].includes(basketOnly[0].symbol));
  assert.equal(assetEtfRecords([basket], "btc").length, 0);
  assert.equal(assetEtfRecords([basket], "eth").length, 0);
  const btc = record("synthetic-single-btc", "BTC");
  const groups = groupEtfRecords([basket, btc]);
  assert.equal(groups.length, 2);
  assert.deepEqual(assetEtfRecords([basket, btc], "btc").map((row) => row.id), [btc.id]);
  assert.equal(filterEtfRecords([basket, btc], { productType: "basket" })[0].id, basket.id);
});

test("multiple underlying assets stay in a basket group even if a provider labels the type other", () => {
  const multi = record("synthetic-multi-other", "ABC", "trading", {
    productType: "other",
    underlyingAssets: [underlying("ABC"), underlying("DOGE")],
  });
  const groups = groupEtfRecords([multi]);
  assert.equal(groups.length, 1);
  assert.ok(!["ABC", "DOGE"].includes(groups[0].symbol));
  assert.equal(assetEtfRecords([multi], "abc").length, 0);
});

test("multi-asset grouping preserves leveraged and inverse exposure types", () => {
  for (const productType of ["leveraged", "inverse"] as const) {
    const multi = record(`synthetic-multi-${productType}`, "ABC", "trading", {
      productType,
      underlyingAssets: [underlying("ABC"), underlying("DOGE")],
    });
    const normalized = normalizeEtfCatalog(catalog([multi]));
    assert.equal(normalized.records[0].productType, productType, "basket membership must not erase risk/exposure type");
    assert.ok(!["ABC", "DOGE"].includes(groupEtfRecords(normalized.records)[0].symbol));
    assert.equal(filterEtfRecords(normalized.records, { productType }).length, 1);
    assert.equal(assetEtfRecords(normalized.records, "abc").length, 0);
  }
});

test("explicit multi-asset products with unknown constituents preserve leveraged exposure and basket grouping", () => {
  const multi = record("synthetic-multi-unknown-constituents", "ABC", "trading", {
    productType: "leveraged", multiAsset: true, underlyingAssets: [],
  });
  const normalized = normalizeEtfCatalog(catalog([multi]));
  assert.equal(normalized.records[0].productType, "leveraged");
  assert.equal(normalized.records[0].multiAsset, true);
  assert.deepEqual(normalized.records[0].underlyingAssets, []);
  assert.equal(groupEtfRecords(normalized.records)[0].key, "basket");
  assert.equal(filterEtfRecords(normalized.records, { productType: "leveraged" }).length, 1);
  assert.equal(filterEtfRecords(normalized.records, { productType: "basket" }).length, 1);
  assert.equal(filterEtfRecords(normalized.records, { asset: "basket" }).length, 1);
  assert.equal(summarizeEtfRecords(normalized.records).approvedAssets, 0);
  assert.equal(summarizeEtfRecords(normalized.records).approvedProducts, 1);
});

test("search matches coin symbol/name, ticker, product name and issuer case-insensitively", () => {
  const searchable = record("search", "DOGE", "trading", {
    underlyingAssets: [underlying("DOGE", "Dogecoin")],
    ticker: "TSTFOX",
    productName: "Synthetic Discovery Fund",
    issuer: "Synthetic Northern Issuer",
  });
  const other = record("search-other", "LTC", "filed");
  for (const query of ["doge", "DOGECOIN", "tstfox", "discovery", "northern"]) {
    assert.deepEqual(filterEtfRecords([searchable, other], { query }).map((row) => row.id), [searchable.id], query);
  }
  assert.equal(filterEtfRecords([searchable, other], { query: "no matching product" }).length, 0);
  assert.equal(filterEtfRecords([searchable, other], { query: " " }).length, 2);
});

test("asset, product type, issuer, detailed status and section filters combine", () => {
  const spot = record("filter-spot", "LTC", "trading", { issuer: "Synthetic Shared Issuer" });
  const future = record("filter-future", "LTC", "filed", { issuer: "Synthetic Shared Issuer", productType: "futures" });
  const inverse = record("filter-inverse", "DOGE", "trading", { productType: "inverse" });
  const rows = [spot, future, inverse];
  assert.deepEqual(filterEtfRecords(rows, { asset: "ltc", productType: "spot", issuer: spot.issuer!, status: "trading", section: "approved" }).map((row) => row.id), [spot.id]);
  assert.deepEqual(filterEtfRecords(rows, { section: "applications" }).map((row) => row.id), [future.id]);
  assert.deepEqual(filterEtfRecords(rows, { productType: "inverse" }).map((row) => row.id), [inverse.id]);
  assert.equal(filterEtfRecords(rows, { asset: "ltc", productType: "futures", section: "approved" }).length, 0);
});

test("normalization preserves verified status only when a matching primary source supports it", () => {
  const verified = record("evidence-valid", "ABC", "approved");
  const normalized = normalizeEtfCatalog(catalog([verified]));
  assert.equal(normalized.records[0].status, "approved");
  assert.equal(normalized.records[0].lastVerifiedAt, VERIFIED_AT);
  assert.equal(normalized.records[0].evidence[0].excerpt, verified.evidence[0].excerpt);
});

test("distinct claims from one primary document remain inspectable through normalization and merges", () => {
  const source = record("same-document-distinct-claims", "ABC", "trading");
  const excerpts = [
    "Synthetic issuer identity claim.",
    "Synthetic launch date claim.",
    "Synthetic basket constituent claim.",
  ];
  source.evidence = excerpts.map((excerpt) => ({ ...source.evidence[0], excerpt }));
  const normalized = normalizeEtfCatalog(catalog([source]));
  assert.deepEqual(normalized.records[0].evidence.map((evidence) => evidence.excerpt).sort(), [...excerpts].sort());
  const duplicate = { ...source, evidence: [source.evidence[1]] };
  const deduplicated = dedupeEtfRecords([source, duplicate]);
  assert.equal(deduplicated[0].evidence.length, 3, "an exact repeated claim deduplicates while different excerpts survive");
  const merged = mergeEtfCatalog(normalized, catalog([duplicate]));
  assert.deepEqual(merged.records[0].evidence.map((evidence) => evidence.excerpt).sort(), [...excerpts].sort());
});

test("missing, secondary, mismatched or incomplete status evidence cannot claim approval", () => {
  const base = record("evidence-invalid", "ABC", "approved");
  const variants: Partial<CryptoEtfRecord>[] = [
    { evidence: [] },
    { evidence: [{ ...base.evidence[0], authority: "secondary" }] },
    { evidence: [{ ...base.evidence[0], status: "filed" }] },
    { evidence: [{ ...base.evidence[0], excerpt: "" }] },
    { evidence: [{ ...base.evidence[0], asOf: "2026-09-01" }] },
    { evidence: [{ ...base.evidence[0], verifiedAt: null }] },
    { lastVerifiedAt: null },
    { statusAsOf: null },
  ];
  for (const [index, override] of variants.entries()) {
    const normalized = normalizeEtfCatalog(catalog([{ ...base, ...override }]));
    assert.equal(normalized.records[0].status, "unverified", `invalid evidence case ${index}`);
    assert.ok(normalized.records[0].note.includes(base.note), "existing source caveat remains visible");
    assert.equal(summarizeEtfRecords(normalized.records).approvedProducts, 0);
  }
});

test("unknown fields remain unknown during normalization", () => {
  const unknown = record("unknown-fields", "NEWCOIN", "unverified", {
    underlyingAssets: [underlying("NEWCOIN", null)],
    productName: null,
    issuer: null,
    ticker: null,
    exchange: null,
    regulator: null,
    filingDate: null,
    approvalDate: null,
    launchDate: null,
    deadline: null,
    productType: "unresolved",
  });
  const result = normalizeEtfCatalog(catalog([unknown])).records[0];
  for (const field of ["productName", "issuer", "ticker", "exchange", "regulator", "filingDate", "approvalDate", "launchDate", "deadline"] as const) {
    assert.equal(result[field], null, field);
  }
  assert.equal(result.underlyingAssets[0].name, null);
  assert.equal(result.underlyingAssets[0].weightPct, null);
  assert.equal(result.productType, "unresolved");
  assert.equal(result.status, "unverified");
});

test("unidentified underlyings remain visible without fabricating single-asset coverage", () => {
  const unresolved = record("unknown-underlying-unresolved", "ABC", "approved", {
    productType: "unresolved", underlyingAssets: [],
  });
  const other = record("unknown-underlying-other", "ABC", "filed", {
    productType: "other", underlyingAssets: [],
  });
  const normalized = normalizeEtfCatalog(catalog([unresolved, other]));
  const groups = groupEtfRecords(normalized.records);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, "unknown");
  assert.equal(groups[0].records.length, 2);
  assert.equal(filterEtfRecords(normalized.records, { asset: "unknown" }).length, 2);
  assert.equal(filterEtfRecords(normalized.records, { asset: "abc" }).length, 0);
  assert.equal(assetEtfRecords(normalized.records, "abc").length, 0);
  const summary = summarizeEtfRecords(normalized.records);
  assert.equal(summary.approvedAssets, 0);
  assert.equal(summary.applicationAssets, 0);
  assert.equal(summary.approvedProducts, 1);
  assert.equal(summary.applications, 1);
  assert.throws(() => normalizeEtfCatalog(catalog([record("empty-spot-underlying", "ABC", "unverified", { underlyingAssets: [] })])));
});

test("status and source dates after their verification dates cannot establish a verified state", () => {
  const statusAfterVerification = record("status-after-verification", "ABC", "approved", {
    statusAsOf: "2026-10-09", lastVerifiedAt: "2026-10-08T23:59:59Z",
  });
  const evidenceAfterVerification = record("source-after-verification", "ABC", "approved");
  evidenceAfterVerification.evidence[0].verifiedAt = "2026-10-08T23:59:59Z";
  for (const invalid of [statusAfterVerification, evidenceAfterVerification]) {
    const normalized = normalizeEtfCatalog(catalog([invalid]));
    assert.equal(normalized.records[0].status, "unverified");
    assert.equal(summarizeEtfRecords(normalized.records).approvedProducts, 0);
  }
});

test("malformed catalogs and invalid product/underlying identities are rejected", () => {
  assert.throws(() => normalizeEtfCatalog(null));
  assert.throws(() => normalizeEtfCatalog({ ...catalog([]), schemaVersion: 2 }));
  assert.throws(() => normalizeEtfCatalog({ ...catalog([]), records: undefined }));
  assert.throws(() => normalizeEtfCatalog({ ...catalog([]), records: [null] }));
  assert.throws(() => normalizeEtfCatalog(catalog([{ ...record("invalid-type"), productType: "imaginary" } as unknown as CryptoEtfRecord])));
  assert.throws(() => normalizeEtfCatalog(catalog([{ ...record("invalid-asset"), underlyingAssets: [{ ...underlying("ABC"), symbol: "" }] }])));
});

test("flow discovery is dynamic and does not infer primary regulatory approval", () => {
  const symbols = ["BTC", "ETH", "XRP", "SOL", "DOGE", "LTC", "ABC"];
  const assets: Asset[] = symbols.map((symbol) => ({
    id: symbol.toLowerCase(), symbol, name: `Synthetic asset ${symbol}`, nameKo: symbol,
    themes: [], okxSpot: null, okxSwap: null, contract: null, identity: "unresolved",
  }));
  const products: EtfProduct[] = symbols.map((symbol) => ({
    assetId: symbol.toLowerCase(), ticker: `SYN-${symbol}`, issuer: "Synthetic flow issuer", jurisdiction: "US",
    exposure: "spot", sessionDate: STATUS_DATE, dailyFlowUsd: 123, aumUsd: null, cumulativeFlowUsd: 456,
    feePct: null, tradingState: "reported", sourceUrl: "https://example.test/synthetic/flow-provider",
  }));
  const before = structuredClone(products);
  const result = recordsFromFlows(products, assets, STATUS_DATE);
  assert.deepEqual(products, before, "catalog adaptation leaves existing flow data intact");
  assert.deepEqual(groupEtfRecords(result).map((group) => group.symbol).sort(), [...symbols].sort());
  assert.ok(result.every((row) => row.status === "unverified"));
  assert.ok(result.every((row) => row.approvalDate === null && row.launchDate === null && row.filingDate === null));
  assert.ok(result.every((row) => row.productName === null), "a flow ticker is not an official ETF name");
  assert.equal(summarizeEtfRecords(result).approvedProducts, 0);
  assert.equal(summarizeEtfRecords(result).applications, 0);
  assert.equal(summarizeEtfRecords(result).unverified, symbols.length);
});

test("flow-derived unresolved exposure is not silently changed to spot", () => {
  const product: EtfProduct = {
    assetId: "newcoin", ticker: "SYN-NEW", issuer: "Synthetic issuer", jurisdiction: "US",
    exposure: "unresolved", sessionDate: null, dailyFlowUsd: null, aumUsd: null, cumulativeFlowUsd: null,
    feePct: null, tradingState: "unreported", sourceUrl: "https://example.test/synthetic/flow",
  };
  const result = recordsFromFlows([product], [], null);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, "unverified");
  assert.equal(result[0].productType, "unresolved");
  assert.equal(result[0].underlyingAssets[0].assetId, "newcoin");
  assert.equal(result[0].underlyingAssets[0].name, null);
});

test("catalog refresh preserves prior products while applying newly verified lifecycle updates", () => {
  const previous = catalog([
    record("merge-retained", "BTC", "trading"),
    record("merge-updated", "ABC", "filed", { statusAsOf: "2026-09-01" }),
  ], { updatedAt: "2026-09-01T00:00:00Z" });
  const next = catalog([
    record("merge-updated", "ABC", "withdrawn"),
    record("merge-new", "NEWCOIN", "under_review"),
  ], { updatedAt: VERIFIED_AT, lastAttemptAt: VERIFIED_AT });
  const previousCopy = structuredClone(previous);
  const nextCopy = structuredClone(next);
  const merged = mergeEtfCatalog(previous, next);
  assert.equal(merged.records.length, 3);
  assert.equal(merged.records.find((row) => row.id === "merge-retained")?.status, "trading");
  assert.equal(merged.records.find((row) => row.id === "merge-updated")?.status, "withdrawn");
  assert.ok(groupEtfRecords(merged.records).some((group) => group.symbol === "NEWCOIN"));
  assert.equal(merged.updatedAt, VERIFIED_AT);
  assert.equal(merged.complete, false);
  assert.deepEqual(previous, previousCopy);
  assert.deepEqual(next, nextCopy);
});
