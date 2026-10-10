import { decodeEntities, monthDateToIso, parseFee, parseMillionsCell, parseUsdCell } from "./format.ts";
import type { EtfHeat, EtfProduct, EtfSession, Disclosure } from "./types";

export function htmlTables(html: string): string[][][] {
  const tables: string[][][] = [];
  let table: string[][] | null = null;
  let row: string[] | null = null;
  let buf: string[] | null = null;
  const parts = html.split(/(<\/?(?:table|tr|td|th)\b[^>]*>)/i);
  for (const part of parts) {
    const tag = /^<(\/?)(table|tr|td|th)\b/i.exec(part);
    if (!tag) {
      if (buf) buf.push(part);
      continue;
    }
    const close = tag[1] === "/";
    const name = tag[2].toLowerCase();
    if (!close && name === "table") table = [];
    else if (close && name === "table" && table) {
      tables.push(table);
      table = null;
    } else if (!close && name === "tr" && table) row = [];
    else if (close && name === "tr" && table && row) {
      if (row.some((c) => c.trim())) table.push(row);
      row = null;
    } else if (!close && (name === "td" || name === "th") && row) buf = [];
    else if (close && (name === "td" || name === "th") && row && buf) {
      row.push(
        decodeEntities(buf.join(" "))
          .replace(/\s+/g, " ")
          .trim(),
      );
      buf = null;
    }
  }
  return tables;
}

function headerIs(row: string[], needles: string[]): boolean {
  const h = row.map((c) => c.toLowerCase());
  return needles.every((n) => h.some((c) => c.includes(n)));
}

export function anchorDate(html: string): string | null {
  const m = /20\d{2}-\d{2}-\d{2}/.exec(html);
  return m ? m[0] : null;
}

export function mmddToIso(mmdd: string, anchor: string): string | null {
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const a = /^(\d{4})-(\d{2})-/.exec(anchor);
  if (!a) return null;
  let year = Number(a[1]);
  const anchorMonth = Number(a[2]);
  if (month > anchorMonth + 1) year -= 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseEtfHtml(html: string, assetId: string, sourceUrl: string): {
  products: EtfProduct[];
  sessions: EtfSession[];
  heat: EtfHeat[];
} {
  const tables = htmlTables(html);
  const anchor = anchorDate(html) ?? new Date().toISOString().slice(0, 10);
  const products: EtfProduct[] = [];
  const sessions: EtfSession[] = [];
  const heat: EtfHeat[] = [];

  const productTable = tables.find((t) => t[0] && headerIs(t[0], ["ticker", "issuer", "daily"]));
  const heatTable = tables.find((t) => t[0] && /^ticker$/i.test(t[0][0] || "") && t[0].some((c) => /^\d{2}-\d{2}$/.test(c)));
  const sessionTable = tables.find((t) => t[0] && headerIs(t[0], ["date", "net flow"]));

  let sessionDate: string | null = null;
  if (productTable) {
    for (const row of productTable.slice(1)) {
      const ticker = row[0]?.trim();
      if (!ticker || ticker.toLowerCase() === "total") continue;
      const flow = parseUsdCell(row[2] || "");
      const reported = row[2] != null && row[2].trim() !== "-" && row[2].trim() !== "";
      products.push({
        assetId,
        ticker,
        issuer: row[1] || "",
        jurisdiction: "US",
        exposure: "unresolved",
        sessionDate: null,
        dailyFlowUsd: flow,
        aumUsd: parseUsdCell(row[3] || ""),
        cumulativeFlowUsd: parseUsdCell(row[4] || ""),
        feePct: parseFee(row[5] || ""),
        tradingState: reported ? "reported" : "unreported",
        sourceUrl,
      });
    }
  }

  const heatByDate = new Map<string, EtfHeat[]>();
  if (heatTable) {
    const dates = heatTable[0].slice(1).map((c) => mmddToIso(c, anchor));
    for (const row of heatTable.slice(1)) {
      const ticker = row[0]?.trim();
      if (!ticker || ticker.toLowerCase() === "total") continue;
      dates.forEach((date, i) => {
        if (!date) return;
        const cell: EtfHeat = {
          assetId,
          ticker,
          date,
          flowUsd: parseMillionsCell(row[i + 1] || ""),
        };
        heat.push(cell);
        const list = heatByDate.get(date) ?? [];
        list.push(cell);
        heatByDate.set(date, list);
      });
    }
  }

  if (sessionTable) {
    const header = sessionTable[0].map((c) => c.toLowerCase());
    const idx = (name: string) => header.findIndex((c) => c.includes(name));
    const iFlow = idx("net flow");
    const iTraded = idx("value");
    const iAum = idx("net asset");
    const iCum = idx("cumul");
    const knownTickers = new Set(heat.filter((c) => c.flowUsd != null).map((c) => `${c.assetId}:${c.ticker}`));
    for (const row of sessionTable.slice(1)) {
      const date = row[0]?.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) continue;
      const cells = (heatByDate.get(date) ?? []).filter((c) => knownTickers.has(`${assetId}:${c.ticker}`));
      const missing = cells.filter((c) => c.flowUsd == null).map((c) => c.ticker);
      const known = cells.filter((c) => c.flowUsd != null);
      const pos = known.filter((c) => (c.flowUsd ?? 0) > 0).length;
      const neg = known.filter((c) => (c.flowUsd ?? 0) < 0).length;
      const flat = known.filter((c) => c.flowUsd === 0).length;
      sessions.push({
        assetId,
        date,
        netFlowUsd: parseUsdCell(row[iFlow] || ""),
        valueTradedUsd: iTraded >= 0 ? parseUsdCell(row[iTraded] || "") : null,
        netAssetsUsd: iAum >= 0 ? parseUsdCell(row[iAum] || "") : null,
        cumFlowUsd: iCum >= 0 ? parseUsdCell(row[iCum] || "") : null,
        partial: missing.length > 0,
        missingTickers: missing,
        positiveIssuers: cells.length ? pos : null,
        negativeIssuers: cells.length ? neg : null,
        flatIssuers: cells.length ? flat : null,
        reportingFunds: cells.length ? known.length : null,
      });
    }
    sessionDate = sessions[0]?.date ?? null;
  }

  for (const p of products) p.sessionDate = sessionDate;
  sessions.sort((a, b) => (a.date < b.date ? 1 : -1));
  return { products, sessions, heat };
}

export type ParsedMstr = {
  balances: { asOf: string; qty: number; costBasisBn: number; avgPx: number }[];
  periods: { start: string; end: string; acquired: number | null; aggregateM: number | null; avgPx: number | null }[];
  equityFundedUsd: number | null;
  cashFundedUsd: number | null;
};

export function parseMstr8k(text: string): ParsedMstr {
  const flat = decodeEntities(text);
  const balances: ParsedMstr["balances"] = [];
  const balRe =
    /As of ([A-Za-z]+ \d{1,2}, \d{4})\*?\s+Aggregate BTC Holdings Aggregate Purchase Price \(in billions\) \(2\) Average Purchase Price \(2\)\s+([\d,]+)\s+\$([\d,.]+)\s+\$([\d,.]+)/g;
  for (const m of flat.matchAll(balRe)) {
    const asOf = monthDateToIso(m[1]);
    if (!asOf) continue;
    balances.push({
      asOf,
      qty: Number(m[2].replace(/,/g, "")),
      costBasisBn: Number(m[3].replace(/,/g, "")),
      avgPx: Number(m[4].replace(/,/g, "")),
    });
  }
  const periods: ParsedMstr["periods"] = [];
  const perRe =
    /During Period ([A-Za-z]+ \d{1,2}, \d{4}) to ([A-Za-z]+ \d{1,2}, \d{4})\*?\s+BTC Acquired \(1\) Aggregate Purchase Price \(in millions\) \(2\) Average Purchase Price \(2\)\s+(-|\$?[\d,]+(?:\.\d+)?)\s+(-|\$?[\d,]+(?:\.\d+)?)\s+(-|\$?[\d,]+(?:\.\d+)?)/g;
  for (const m of flat.matchAll(perRe)) {
    const start = monthDateToIso(m[1]);
    const end = monthDateToIso(m[2]);
    if (!start || !end) continue;
    const num = (v: string) => {
      if (v === "-" || v === "$") return null;
      const n = Number(v.replace(/[$,]/g, ""));
      return Number.isFinite(n) ? n : null;
    };
    periods.push({ start, end, acquired: num(m[3]), aggregateM: num(m[4]), avgPx: num(m[5]) });
  }
  const fund = /\$([0-9.]+) million of bitcoin purchases were made using net proceeds from MSTR Stock sales and \$([0-9.]+) million of bitcoin purchases were made using USD Cash/i.exec(
    flat,
  );
  return {
    balances,
    periods,
    equityFundedUsd: fund ? Number(fund[1]) * 1e6 : null,
    cashFundedUsd: fund ? Number(fund[2]) * 1e6 : null,
  };
}

export type ParsedBmnr = {
  asOf: string | null;
  ethQty: number | null;
  ethPx: number | null;
  btcQty: number | null;
  weekBoughtEth: number | null;
  stakedEth: number | null;
  cashUsd: number | null;
  supplyEth: number | null;
};

export function parseBmnrExhibit(text: string): ParsedBmnr {
  const flat = decodeEntities(text);
  const as = /As of ([A-Za-z]+ \d{1,2}, \d{4})/i.exec(flat);
  const eth = /comprised of ([\d,]+) ETH at \$([\d,]+)/i.exec(flat);
  const btc = /([\d,]+) Bitcoin \(BTC\)/i.exec(flat);
  const week = /acquired ([\d,]+) ETH/i.exec(flat);
  const staked = /([\d,]+) staked ETH/i.exec(flat) || /total staked[^\d]{0,40}([\d,]+)/i.exec(flat);
  const cash = /total cash[^$]{0,40}\$([\d,.]+)\s*million/i.exec(flat);
  const supply = /ETH supply \(of ([\d,.]+) million ETH\)/i.exec(flat);
  return {
    asOf: as ? monthDateToIso(as[1]) : null,
    ethQty: eth ? Number(eth[1].replace(/,/g, "")) : null,
    ethPx: eth ? Number(eth[2].replace(/,/g, "")) : null,
    btcQty: btc ? Number(btc[1].replace(/,/g, "")) : null,
    weekBoughtEth: week ? Number(week[1].replace(/,/g, "")) : null,
    stakedEth: staked ? Number(staked[1].replace(/,/g, "")) : null,
    cashUsd: cash ? Number(cash[1].replace(/,/g, "")) * 1e6 : null,
    supplyEth: supply ? Number(supply[1].replace(/,/g, "")) * 1e6 : null,
  };
}

export function disclosuresFromMstr(
  parsed: ParsedMstr,
  published: string,
  sourceUrl: string,
  retrievedAt: string,
): Disclosure[] {
  const out: Disclosure[] = [];
  for (const b of parsed.balances) {
    out.push({
      id: `mstr-bal-${b.asOf}`,
      companyId: "mstr",
      assetId: "btc",
      published,
      asOf: b.asOf,
      periodStart: null,
      periodEnd: null,
      endingQty: b.qty,
      acquiredQty: null,
      soldQty: null,
      rewardQty: null,
      avgPurchaseUsd: b.avgPx,
      aggregatePurchaseUsd: b.costBasisBn * 1e9,
      proceedsFromEquityUsd: null,
      cashUsedUsd: null,
      cashAndSecuritiesUsd: null,
      stakingQty: null,
      classification: "balance",
      excerpt: `${b.asOf} 기준 보유 ${b.qty.toLocaleString("en-US")} BTC, 공시 평균 매수가 $${b.avgPx.toLocaleString("en-US")}`,
      sourceUrl,
      retrievedAt,
    });
  }
  for (const p of parsed.periods) {
    if (p.acquired == null) continue;
    out.push({
      id: `mstr-buy-${p.start}-${p.end}`,
      companyId: "mstr",
      assetId: "btc",
      published,
      asOf: p.end,
      periodStart: p.start,
      periodEnd: p.end,
      endingQty: null,
      acquiredQty: p.acquired,
      soldQty: 0,
      rewardQty: 0,
      avgPurchaseUsd: p.avgPx,
      aggregatePurchaseUsd: p.aggregateM == null ? null : p.aggregateM * 1e6,
      proceedsFromEquityUsd: parsed.equityFundedUsd,
      cashUsedUsd: parsed.cashFundedUsd,
      cashAndSecuritiesUsd: null,
      stakingQty: null,
      classification: p.acquired > 0 ? "purchase" : "balance",
      excerpt: `${p.start}–${p.end} BTC 매수 ${p.acquired.toLocaleString("en-US")}개. 주식 순수입 사용 ${parsed.equityFundedUsd ?? "미기재"}, 현금 사용 ${parsed.cashFundedUsd ?? "미기재"}.`,
      sourceUrl,
      retrievedAt,
    });
  }
  return out;
}

export function disclosuresFromBmnr(
  parsed: ParsedBmnr,
  published: string,
  sourceUrl: string,
  retrievedAt: string,
): Disclosure[] {
  if (!parsed.asOf || parsed.ethQty == null) return [];
  const out: Disclosure[] = [
    {
      id: `bmnr-eth-${parsed.asOf}-${parsed.ethQty}`,
      companyId: "bmnr",
      assetId: "eth",
      published,
      asOf: parsed.asOf,
      periodStart: null,
      periodEnd: null,
      endingQty: parsed.ethQty,
      acquiredQty: null,
      soldQty: null,
      rewardQty: null,
      avgPurchaseUsd: null,
      aggregatePurchaseUsd: null,
      proceedsFromEquityUsd: null,
      cashUsedUsd: null,
      cashAndSecuritiesUsd: parsed.cashUsd,
      stakingQty: parsed.stakedEth,
      classification: "balance",
      excerpt: `${parsed.asOf} 기준 ETH ${parsed.ethQty.toLocaleString("en-US")}. 스테이킹 ${parsed.stakedEth?.toLocaleString("en-US") ?? "미기재"}는 추가 보유가 아님. 현금·유가증권 ${parsed.cashUsd ?? "미기재"}.`,
      sourceUrl,
      retrievedAt,
    },
  ];
  if (parsed.btcQty != null) {
    out.push({
      id: `bmnr-btc-${parsed.asOf}`,
      companyId: "bmnr",
      assetId: "btc",
      published,
      asOf: parsed.asOf,
      periodStart: null,
      periodEnd: null,
      endingQty: parsed.btcQty,
      acquiredQty: null,
      soldQty: null,
      rewardQty: null,
      avgPurchaseUsd: null,
      aggregatePurchaseUsd: null,
      proceedsFromEquityUsd: null,
      cashUsedUsd: null,
      cashAndSecuritiesUsd: parsed.cashUsd,
      stakingQty: null,
      classification: "balance",
      excerpt: `같은 보도자료의 BTC 보유 ${parsed.btcQty.toLocaleString("en-US")}. ETH 합계에 넣지 않음.`,
      sourceUrl,
      retrievedAt,
    });
  }
  if (parsed.weekBoughtEth != null) {
    out.push({
      id: `bmnr-buy-${parsed.asOf}`,
      companyId: "bmnr",
      assetId: "eth",
      published,
      asOf: parsed.asOf,
      periodStart: null,
      periodEnd: parsed.asOf,
      endingQty: null,
      acquiredQty: parsed.weekBoughtEth,
      soldQty: null,
      rewardQty: null,
      avgPurchaseUsd: parsed.ethPx,
      aggregatePurchaseUsd: null,
      proceedsFromEquityUsd: null,
      cashUsedUsd: null,
      cashAndSecuritiesUsd: parsed.cashUsd,
      stakingQty: parsed.stakedEth,
      classification: "purchase",
      excerpt: `직전 주 매수 ${parsed.weekBoughtEth.toLocaleString("en-US")} ETH. 보상과 구분된 매수로 기재. 마크 가격 $${parsed.ethPx ?? "—"}는 취득단가가 아님.`,
      sourceUrl,
      retrievedAt,
    });
  }
  return out;
}

export function stripRss(xml: string): { title: string; link: string; date: string | null }[] {
  const items: { title: string; link: string; date: string | null }[] = [];
  const blocks = xml.split(/<item\b/i).slice(1, 13);
  for (const block of blocks) {
    const title = decodeEntities((/<title>([\s\S]*?)<\/title>/i.exec(block)?.[1] ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
    const link = (/<link>([\s\S]*?)<\/link>/i.exec(block)?.[1] ?? "").trim();
    const date = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(block)?.[1]?.trim() ?? null;
    if (title && link.startsWith("http")) items.push({ title, link, date });
  }
  return items;
}
