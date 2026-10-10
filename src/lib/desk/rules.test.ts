import assert from "node:assert/strict";
import test from "node:test";
import { disclosuresFromBmnr, disclosuresFromMstr, htmlTables, parseBmnrExhibit, parseEtfHtml, parseMstr8k } from "./parse.ts";
import { parseUsdCell } from "./format.ts";
import { buildReconciliations, dedupeHits, etfStrength, evalCondition, reconcilePair, sessionWindow } from "./rules.ts";
import type { EtfSession } from "./types.ts";

const MSTR = `BTC Update On October 5, 2026, Strategy announced updates with respect to its bitcoin holdings: During Period September 28, 2026 to September 30, 2026 BTC Acquired (1) Aggregate Purchase Price (in millions) (2) Average Purchase Price (2) - - - As of September 30, 2026 Aggregate BTC Holdings Aggregate Purchase Price (in billions) (2) Average Purchase Price (2) 847,666 $63.95 $75,436.6 During Period October 1, 2026 to October 4, 2026* BTC Acquired (1) Aggregate Purchase Price (in millions) (2) Average Purchase Price (2) 334 $28.7 $85,838.8 As of October 4, 2026* Aggregate BTC Holdings Aggregate Purchase Price (in billions) (2) Average Purchase Price (2) 848,000 $63.97 $75,440.7 *Bitcoin activity. (1) $15.7 million of bitcoin purchases were made using net proceeds from MSTR Stock sales and $13.0 million of bitcoin purchases were made using USD Cash.`;

const BMNR = `As of October 4, 2026 at 6:30pm ET, the Company's crypto holdings are comprised of 6,016,414 ETH at $2,726 per ETH, 214 Bitcoin (BTC), and total cash & marketable securities of $643 million. Bitmine's ETH holdings are 4.9% of the ETH supply (of 122.1 million ETH). Over the past week, we acquired 15,112 ETH. Bitmine has 5,067,309 staked ETH.`;

test("usd cells keep zero, missing, and sign distinct", () => {
  assert.equal(parseUsdCell("+$0"), 0);
  assert.equal(parseUsdCell("-"), null);
  assert.equal(parseUsdCell("-$3.6M"), -3.6e6);
  assert.equal(parseUsdCell("+$22.4M"), 22.4e6);
  assert.equal(parseUsdCell("$66.30B"), 66.3e9);
});

test("mstr filing reconciles purchase versus balance", () => {
  const parsed = parseMstr8k(MSTR);
  assert.equal(parsed.balances.length, 2);
  assert.equal(parsed.balances[0].qty, 847666);
  assert.equal(parsed.balances[1].qty, 848000);
  assert.equal(parsed.periods.filter((p) => p.acquired != null).length, 1);
  assert.equal(parsed.periods.find((p) => p.acquired != null)?.acquired, 334);
  assert.equal(parsed.equityFundedUsd, 15.7e6);
  assert.equal(parsed.cashFundedUsd, 13e6);
  const discs = disclosuresFromMstr(parsed, "2026-10-05", "https://www.sec.gov/example", "2026-10-10T00:00:00Z");
  const rec = buildReconciliations(discs);
  assert.equal(rec.length, 1);
  assert.equal(rec[0].residual, 0);
  assert.equal(rec[0].buys, 334);
  assert.equal(rec[0].rewards, 0);
});

test("bmnr staking is not added to ownership", () => {
  const parsed = parseBmnrExhibit(BMNR);
  assert.equal(parsed.ethQty, 6016414);
  assert.equal(parsed.btcQty, 214);
  assert.equal(parsed.stakedEth, 5067309);
  assert.equal(parsed.weekBoughtEth, 15112);
  const discs = disclosuresFromBmnr(parsed, "2026-10-05", "https://www.sec.gov/ex", "2026-10-10T00:00:00Z");
  const eth = discs.find((d) => d.assetId === "eth" && d.classification === "balance");
  assert.ok(eth);
  assert.equal(eth?.endingQty, 6016414);
  assert.notEqual((eth?.endingQty ?? 0) + (eth?.stakingQty ?? 0), eth?.endingQty);
  assert.equal(discs.filter((d) => d.assetId === "btc").length, 1);
});

test("holiday gaps and partial sessions are not zero flows", () => {
  const sessions: EtfSession[] = [1, 2, 3, 4].map((i) => ({
    assetId: "btc",
    date: `2026-10-0${i}`,
    netFlowUsd: 10,
    valueTradedUsd: 1,
    netAssetsUsd: 1,
    cumFlowUsd: 1,
    partial: false,
    missingTickers: [],
    positiveIssuers: 1,
    negativeIssuers: 0,
    flatIssuers: 0,
    reportingFunds: 1,
  }));
  const short = sessionWindow(sessions, 0, 5);
  assert.equal(short.sum, null);
  assert.equal(short.partial, true);
  const withHole: EtfSession[] = [
    ...sessions,
    { ...sessions[0], date: "2026-10-05", netFlowUsd: null, partial: true, missingTickers: ["IBIT"] },
  ];
  const hole = sessionWindow(withHole.reverse(), 0, 5);
  assert.equal(hole.sum, null);
  const full = etfStrength(
    Array.from({ length: 10 }, (_, i) => ({
      ...sessions[0],
      date: `2026-09-${String(30 - i).padStart(2, "0")}`,
      netFlowUsd: i < 5 ? 5 : 1,
      partial: false,
      missingTickers: [],
    })),
  );
  assert.equal(full.hit, true);
});

test("etf html does not turn a dash into a zero issuer", () => {
  const html = `<table><tr><th>Ticker</th><th>Issuer</th><th>Daily flow</th><th>Net assets</th><th>Cumulative flow</th><th>Fee</th></tr>
  <tr><td>IBIT</td><td>BlackRock</td><td>+$22.4M</td><td>$66.30B</td><td>+$65.73B</td><td>0.25%</td></tr>
  <tr><td>DEFI</td><td>Proxy</td><td>-</td><td>-</td><td>-</td><td>-</td></tr></table>
  <table><tr><th>Ticker</th><th>10-08</th><th>10-09</th></tr><tr><td>IBIT</td><td>1.0</td><td>-</td></tr><tr><td>DEFI</td><td>-</td><td>-</td></tr></table>
  <p>2026-10-09</p>
  <table><tr><th>Date</th><th>Net flow</th><th>Value traded</th><th>Net assets</th><th>Cumulative</th></tr>
  <tr><td>2026-10-09</td><td>+$21.1M</td><td>$1.44B</td><td>$105.84B</td><td>+$57.11B</td></tr></table>`;
  const parsed = parseEtfHtml(html, "btc", "https://example.test/etf");
  assert.equal(parsed.products.length, 2);
  assert.equal(parsed.products[1].dailyFlowUsd, null);
  assert.equal(parsed.products[1].tradingState, "unreported");
  const session = parsed.sessions[0];
  assert.equal(session.partial, true);
  assert.ok(session.missingTickers.includes("IBIT"));
  assert.equal(session.netFlowUsd, 21.1e6);
  assert.notEqual(session.valueTradedUsd, session.netFlowUsd);
  assert.equal(htmlTables(html).length, 3);
});

test("duplicate alerts collapse and missing data does not fire", () => {
  const hits = dedupeHits([
    { assetId: "btc", rule: "etf-strength-v1", status: "priority", why: "a", recency: "2026-10-09", rank: 2 },
    { assetId: "btc", rule: "etf-strength-v1", status: "priority", why: "a2", recency: "2026-10-08", rank: 2 },
  ]);
  assert.equal(hits.length, 1);
  const missing = evalCondition(
    { id: "1", assetId: "btc", field: "etf5", cmp: "gt", value: 0, note: "" },
    undefined,
    null,
  );
  assert.equal(missing.fired, false);
  const fired = evalCondition(
    { id: "2", assetId: "btc", field: "priceUsd", cmp: "lt", value: 100, note: "" },
    { priceUsd: 90, change24hPct: null, fundingRate: null },
    null,
  );
  assert.equal(fired.fired, true);
});

test("reward is not a purchase in reconciliation", () => {
  const rec = reconcilePair("x", "btc", 100, "2026-09-01", 110, "2026-10-01", 0, 0, 10, "https://example.test");
  assert.equal(rec.residual, 0);
  assert.equal(rec.buys, 0);
  assert.equal(rec.rewards, 10);
});
