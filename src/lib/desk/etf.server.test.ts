import assert from "node:assert/strict";
import test from "node:test";
import { catalogAssets, catalogWithFlows, refreshCatalog } from "./etf.server.ts";
import type { Asset, CryptoEtfRecord, CryptoEtfStatus, DeskSnapshot, EtfCatalog, EtfProduct } from "./types.ts";

// Every product and source document below is an injected, synthetic fixture.
const NOW = "2026-10-10T12:00:00Z";
const OLD_VERIFIED = "2026-10-02T00:00:00Z";
const FEED = "https://feed.example.test/synthetic-etf-catalog.json";
const HOSTS = ["feed.example.test"];

function syntheticRecord(id: string, symbol = "ABC", status: CryptoEtfStatus = "unverified", statusAsOf = "2026-10-09"): CryptoEtfRecord {
  const url = `https://www.sec.gov/Archives/synthetic-test/${id}.htm`;
  return {
    id,
    aliases: [],
    underlyingAssets: [{ assetId: symbol.toLowerCase(), symbol, name: `Synthetic asset ${symbol}`, weightPct: null }],
    productName: `Synthetic ${id} Fund`,
    issuer: `Synthetic ${id} issuer`,
    ticker: null,
    jurisdiction: "US",
    productType: "spot",
    status,
    statusAsOf: status === "unverified" ? null : statusAsOf,
    filingDate: null,
    approvalDate: null,
    launchDate: null,
    deadline: null,
    exchange: null,
    regulator: null,
    filingUrl: null,
    sourceUrl: url,
    lastVerifiedAt: status === "unverified" ? null : NOW,
    identifiers: { cik: null, seriesId: null, registrationFile: null },
    evidence: status === "unverified" ? [] : [{
      url,
      authority: "regulator",
      title: "Synthetic regulator document",
      excerpt: `Synthetic ${id} status ${status} on ${statusAsOf}.`,
      asOf: statusAsOf,
      verifiedAt: NOW,
      status,
    }],
    note: "Synthetic test fixture, never used as investment data.",
  };
}

function syntheticCatalog(records: CryptoEtfRecord[], overrides: Partial<EtfCatalog> = {}): EtfCatalog {
  return {
    schemaVersion: 1,
    scope: "US",
    updatedAt: OLD_VERIFIED,
    complete: false,
    coverageNote: "Synthetic incomplete test catalog.",
    records,
    lastAttemptAt: null,
    refreshError: null,
    ...overrides,
  };
}

function syntheticAsset(id = "btc"): Asset {
  return {
    id, symbol: id.toUpperCase(), name: `Synthetic asset ${id}`, nameKo: id,
    themes: ["Existing"], okxSpot: "EXISTING-USDT", okxSwap: null, contract: null, identity: "native",
  };
}

function syntheticFlow(assetId = "abc", ticker = "TSTFLOW"): EtfProduct {
  return {
    assetId, ticker, issuer: "Synthetic flow issuer", jurisdiction: "US", exposure: "spot",
    sessionDate: "2026-10-09", dailyFlowUsd: 123, aumUsd: 456, cumulativeFlowUsd: 789,
    feePct: null, tradingState: "reported", sourceUrl: "https://example.test/synthetic-flows",
  };
}

function syntheticEtfData(products: EtfProduct[], catalog?: EtfCatalog): DeskSnapshot["etf"] {
  return {
    ...(catalog ? { catalog } : {}),
    provenance: {
      source: "Synthetic test flow provider", url: "https://example.test/synthetic-flows",
      retrievedAt: NOW, asOf: "2026-10-09", kind: "snapshot", note: "Synthetic test fixture.",
    },
    products, sessions: [], heat: [], milestones: [], coverageNote: "Synthetic observed flows.",
  };
}

function urlString(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

function feedFetcher(input: unknown, documentResponses: Map<string, Response | Error> = new Map(), calls: string[] = []): typeof fetch {
  return async (url, init) => {
    const href = urlString(url);
    calls.push(href);
    assert.equal(init?.redirect, "error", "neither catalog nor primary document redirects are followed");
    if (href === FEED) return new Response(JSON.stringify(input), { headers: { "content-type": "application/json" } });
    const response = documentResponses.get(href);
    assert.ok(response, `Unexpected network request in synthetic test: ${href}`);
    if (response instanceof Error) throw response;
    return response.clone();
  };
}

async function assertPreserved(previous: EtfCatalog, options: Parameters<typeof refreshCatalog>[1]): Promise<void> {
  const original = structuredClone(previous);
  const result = await refreshCatalog(previous, { now: NOW, ...options });
  assert.deepEqual(result.records, original.records);
  assert.equal(result.updatedAt, original.updatedAt, "a failed refresh cannot make old data look newly updated");
  assert.equal(result.lastAttemptAt, NOW);
  assert.ok(result.refreshError, "the refresh failure remains visible");
  assert.equal(result.complete, false);
  assert.deepEqual(previous, original, "the caller's last good catalog remains unchanged");
}

test("no configured catalog URL preserves the last good records and freshness", async () => {
  const previous = syntheticCatalog([syntheticRecord("server-no-url", "ABC", "filed")]);
  let called = false;
  await assertPreserved(previous, { url: "", fetcher: async () => { called = true; throw new Error("Must not fetch"); } });
  assert.equal(called, false);
});

test("catalog refresh requires an allowed HTTPS host without credentials or a custom port", async () => {
  const previous = syntheticCatalog([syntheticRecord("server-url-check")]);
  let fetchCount = 0;
  const fetcher: typeof fetch = async () => { fetchCount++; throw new Error("Must not fetch"); };
  for (const url of [
    "not a URL", "http://feed.example.test/catalog.json", "https://unlisted.example.test/catalog.json",
    "https://user:password@feed.example.test/catalog.json", "https://feed.example.test:444/catalog.json",
  ]) {
    await assertPreserved(previous, { url, allowedHosts: HOSTS, fetcher });
  }
  assert.equal(fetchCount, 0);
});

test("HTTP errors, redirects and network failures preserve the catalog", async () => {
  const previous = syntheticCatalog([syntheticRecord("server-http-check")]);
  for (const status of [302, 403, 500]) {
    const fetcher: typeof fetch = async (_url, init) => {
      assert.equal(init?.redirect, "error");
      return new Response("Synthetic error", { status, headers: status === 302 ? { location: "https://unlisted.example.test/catalog" } : {} });
    };
    await assertPreserved(previous, { url: FEED, allowedHosts: HOSTS, fetcher });
  }
  await assertPreserved(previous, { url: FEED, allowedHosts: HOSTS, fetcher: async () => { throw new TypeError("Synthetic network failure"); } });
});

test("malformed JSON, invalid schemas, changed scope and absent bodies preserve prior data", async () => {
  const previous = syntheticCatalog([syntheticRecord("server-invalid-data")]);
  const invalidInputs = [null, { ...syntheticCatalog([]), schemaVersion: 99 }, { ...syntheticCatalog([]), records: [{}] }, syntheticCatalog([], { scope: "CA" })];
  for (const input of invalidInputs) {
    await assertPreserved(previous, { url: FEED, allowedHosts: HOSTS, fetcher: feedFetcher(input) });
  }
  await assertPreserved(previous, { url: FEED, allowedHosts: HOSTS, fetcher: async () => new Response("{invalid json") });
  await assertPreserved(previous, { url: FEED, allowedHosts: HOSTS, fetcher: async () => new Response(null) });
});

test("oversized catalog responses fail without deleting saved records", async () => {
  const previous = syntheticCatalog([syntheticRecord("server-too-large")]);
  await assertPreserved(previous, { url: FEED, allowedHosts: HOSTS, fetcher: async () => new Response("x".repeat(2_500_001)) });
});

test("catalog assets discover new and basket underlyings while preserving known market identities", () => {
  const existing = syntheticAsset();
  const newCoin = syntheticRecord("server-discovery", "NEWCOIN");
  const basket = { ...syntheticRecord("server-basket", "ABC"), productType: "basket" as const,
    underlyingAssets: [...newCoin.underlyingAssets, syntheticRecord("server-basket-ltc", "LTC").underlyingAssets[0]] };
  const result = catalogAssets([syntheticRecord("server-existing", "BTC"), newCoin, basket], [existing]);
  assert.equal(result.filter((asset) => asset.id === "newcoin").length, 1);
  assert.equal(result.find((asset) => asset.id === "btc"), existing, "an ETF record cannot overwrite existing venue identity");
  for (const id of ["newcoin", "ltc"]) {
    const discovered = result.find((asset) => asset.id === id);
    assert.ok(discovered);
    assert.equal(discovered.okxSpot, null);
    assert.equal(discovered.okxSwap, null);
    assert.equal(discovered.contract, null);
    assert.equal(discovered.identity, "unresolved");
    assert.ok(discovered.themes.includes("ETF"));
  }
  assert.equal(result.some((asset) => asset.id === "basket"), false, "a product category is not a fabricated coin");
});

test("catalogWithFlows matches existing primary products without duplicating or mutating flow data", () => {
  const primary = { ...syntheticRecord("server-matched-flow", "ABC", "trading"), ticker: "TSTMATCH" };
  const flow = syntheticFlow("abc", "TSTMATCH");
  const data = syntheticEtfData([flow], syntheticCatalog([primary]));
  const original = structuredClone(data);
  const result = catalogWithFlows(data, [syntheticAsset("abc")]);
  const matching = result.records.filter((row) => row.ticker === "TSTMATCH" && row.underlyingAssets[0]?.assetId === "abc");
  assert.equal(matching.length, 1);
  assert.equal(matching[0].id, primary.id);
  assert.equal(matching[0].status, "trading");
  assert.deepEqual(data, original, "the existing flow/API shape remains untouched");
});

test("a later verified product replaces its cached flow observation without duplicating the product", () => {
  const flow = syntheticFlow("abc", "TSTCACHED");
  const cached = catalogWithFlows(syntheticEtfData([flow]), [syntheticAsset("abc")]);
  const primary = { ...syntheticRecord("server-upgraded-cached-flow", "ABC", "trading"), ticker: flow.ticker };
  const result = catalogWithFlows(syntheticEtfData([flow], { ...cached, records: [...cached.records, primary] }), [syntheticAsset("abc")]);
  const matching = result.records.filter((row) => row.ticker === flow.ticker && row.underlyingAssets[0]?.assetId === "abc");
  assert.equal(matching.length, 1);
  assert.equal(matching[0].status, "trading");
  assert.equal(matching[0].id, primary.id);
});

test("unmatched flow rows remain observations and different assets are not merged by ticker", () => {
  const primary = { ...syntheticRecord("server-primary-other-asset", "ABC", "trading"), ticker: "TSTSHARED" };
  const result = catalogWithFlows(syntheticEtfData([syntheticFlow("newcoin", "TSTSHARED")], syntheticCatalog([primary])), []);
  const observation = result.records.find((row) => row.underlyingAssets[0]?.assetId === "newcoin" && row.ticker === "TSTSHARED");
  assert.ok(observation);
  assert.equal(observation.status, "unverified");
  assert.equal(observation.productName, null);
  assert.equal(observation.productType, "unresolved");
  assert.ok(result.records.some((row) => row.id === primary.id));
});

test("injected catalog feeds discover new assets and retain historical records without completeness claims", async () => {
  const historical = syntheticRecord("server-history", "LTC", "withdrawn");
  const previous = syntheticCatalog([historical]);
  const fresh = syntheticRecord("server-fresh", "NEWCOIN");
  const next = syntheticCatalog([fresh], { updatedAt: NOW, complete: true });
  const result = await refreshCatalog(previous, { url: FEED, allowedHosts: HOSTS, fetcher: feedFetcher(next), now: NOW });
  assert.equal(result.refreshError, null);
  assert.equal(result.updatedAt, NOW);
  assert.equal(result.lastAttemptAt, NOW);
  assert.equal(result.complete, false, "a feed's own claim does not certify an exhaustive verified universe");
  assert.equal(result.records.find((row) => row.id === historical.id)?.status, "withdrawn");
  assert.ok(result.records.some((row) => row.id === fresh.id));
  assert.ok(catalogAssets(result.records, []).some((asset) => asset.symbol === "NEWCOIN"));
});

test("primary status evidence is read through and matched before a new filing becomes verified", async () => {
  const candidate = syntheticRecord("server-read-through", "NEWCOIN", "filed");
  candidate.lastVerifiedAt = "2026-10-09T12:00:00Z";
  candidate.evidence[0].verifiedAt = "2026-10-09T12:00:00Z";
  const excerpt = candidate.evidence[0].excerpt;
  const document = new Response(`<html><body><p>${excerpt.replaceAll(" ", "  \n")}</p></body></html>`, { headers: { "content-type": "text/html" } });
  const calls: string[] = [];
  const result = await refreshCatalog(syntheticCatalog([]), {
    url: FEED, allowedHosts: HOSTS, now: NOW,
    fetcher: feedFetcher(syntheticCatalog([candidate], { updatedAt: NOW }), new Map([[candidate.evidence[0].url, document]]), calls),
  });
  assert.equal(result.refreshError, null);
  assert.ok(calls.includes(candidate.evidence[0].url), "fetch the primary document rather than trusting a feed excerpt");
  const verified = result.records.find((row) => row.id === candidate.id);
  assert.equal(verified?.status, "filed");
  assert.equal(verified?.lastVerifiedAt, NOW);
  assert.equal(verified?.evidence[0].verifiedAt, NOW);
  assert.ok(catalogAssets(result.records, []).some((asset) => asset.id === "newcoin"));
});

test("primary excerpts match visible Unicode text encoded as numeric and named HTML entities", async () => {
  const candidate = syntheticRecord("server-html-entities", "NEWCOIN", "approved");
  candidate.evidence[0].excerpt = "Synthetic company’s “NEWCOIN” status approved.";
  const document = new Response("<html><body>Synthetic&#160;company&#x2019;s &ldquo;NEWCOIN&rdquo; status approved.</body></html>");
  const result = await refreshCatalog(syntheticCatalog([]), {
    url: FEED, allowedHosts: HOSTS, now: NOW,
    fetcher: feedFetcher(syntheticCatalog([candidate], { updatedAt: NOW }), new Map([[candidate.evidence[0].url, document]])),
  });
  const verified = result.records.find((row) => row.id === candidate.id);
  assert.equal(verified?.status, "approved");
  assert.equal(verified?.lastVerifiedAt, NOW);
  assert.equal(verified?.evidence[0].verifiedAt, NOW);
});

test("unreachable or mismatched primary evidence cannot establish a new approved product", async () => {
  const candidate = syntheticRecord("server-unverified-source", "NEWCOIN", "approved");
  for (const response of [
    new Response("Synthetic unavailable document", { status: 404 }),
    new Response("<html><body>Unrelated synthetic primary source content.</body></html>"),
    new TypeError("Synthetic primary source failure"),
  ]) {
    const result = await refreshCatalog(syntheticCatalog([]), {
      url: FEED, allowedHosts: HOSTS, now: NOW,
      fetcher: feedFetcher(syntheticCatalog([candidate], { updatedAt: NOW }), new Map([[candidate.evidence[0].url, response]])),
    });
    const observed = result.records.find((row) => row.id === candidate.id);
    assert.ok(observed, "keep the discovery visible with its verification caveat");
    assert.equal(observed.status, "unverified");
    assert.notEqual(observed.lastVerifiedAt, NOW, "a failed primary source read is not a fresh verification");
  }
});

test("an excerpt with no visible text cannot verify status by matching the empty string", async () => {
  const candidate = syntheticRecord("server-empty-excerpt", "NEWCOIN", "approved");
  candidate.evidence[0].excerpt = "<b> </b>";
  const result = await refreshCatalog(syntheticCatalog([]), {
    url: FEED, allowedHosts: HOSTS, now: NOW,
    fetcher: feedFetcher(syntheticCatalog([candidate], { updatedAt: NOW }), new Map([[candidate.evidence[0].url, new Response("<html><body>Unrelated synthetic document</body></html>")]])),
  });
  assert.equal(result.records.find((row) => row.id === candidate.id)?.status, "unverified");
});

test("failed primary verification cannot replace a previously verified lifecycle status", async () => {
  const old = syntheticRecord("server-protect-verified", "ABC", "filed", "2026-10-01");
  old.lastVerifiedAt = OLD_VERIFIED;
  old.evidence[0].verifiedAt = OLD_VERIFIED;
  const claimed = syntheticRecord(old.id, "ABC", "approved");
  const result = await refreshCatalog(syntheticCatalog([old]), {
    url: FEED, allowedHosts: HOSTS, now: NOW,
    fetcher: feedFetcher(syntheticCatalog([claimed], { updatedAt: NOW }), new Map([[claimed.evidence[0].url, new Response("Unrelated source content")]])),
  });
  const retained = result.records.find((row) => row.id === old.id);
  assert.equal(retained?.status, "filed");
  assert.equal(retained?.statusAsOf, "2026-10-01");
  assert.equal(retained?.lastVerifiedAt, OLD_VERIFIED);
  assert.equal(retained?.evidence.some((evidence) => evidence.status === "approved" && evidence.verifiedAt === NOW), false);
});

test("incoming unverified records cannot smuggle conflicting claimed verification into saved evidence", async () => {
  const trusted = syntheticRecord("server-unverified-conflict", "ABC", "approved");
  trusted.lastVerifiedAt = "2026-10-09T12:00:00Z";
  trusted.evidence[0].verifiedAt = trusted.lastVerifiedAt;
  const malicious = syntheticRecord(trusted.id, "ABC", "withdrawn");
  malicious.status = "unverified";
  malicious.lastVerifiedAt = null;
  const calls: string[] = [];
  const result = await refreshCatalog(syntheticCatalog([trusted]), {
    url: FEED, allowedHosts: HOSTS, now: NOW,
    fetcher: feedFetcher(syntheticCatalog([malicious], { updatedAt: NOW }), new Map(), calls),
  });
  const retained = result.records.find((row) => row.id === trusted.id);
  assert.equal(retained?.status, "approved");
  assert.equal(retained?.lastVerifiedAt, trusted.lastVerifiedAt);
  assert.equal(retained?.evidence.find((evidence) => evidence.status === "withdrawn")?.verifiedAt, null);
  assert.deepEqual(calls, [FEED], "unverified source claims cannot supply proof without an independent read");
});

test("a claimed source date after the actual refresh time cannot become verified", async () => {
  const future = syntheticRecord("server-future-status", "NEWCOIN", "approved", "2026-10-11");
  future.lastVerifiedAt = "2026-10-12T00:00:00Z";
  future.evidence[0].verifiedAt = future.lastVerifiedAt;
  const calls: string[] = [];
  const result = await refreshCatalog(syntheticCatalog([]), {
    url: FEED, allowedHosts: HOSTS, now: NOW,
    fetcher: feedFetcher(syntheticCatalog([future]), new Map(), calls),
  });
  const observed = result.records.find((row) => row.id === future.id);
  assert.equal(observed?.status, "unverified");
  assert.equal(observed?.lastVerifiedAt, null);
  assert.equal(observed?.evidence[0].verifiedAt, null);
  assert.deepEqual(calls, [FEED], "a future-dated assertion is not current regulatory proof");
});
