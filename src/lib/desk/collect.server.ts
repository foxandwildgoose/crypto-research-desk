import { readFile } from "node:fs/promises";
import { CG_IDS, SEED_ASSETS, companyKind } from "./assets.ts";
import { etDateTime, monthDateToIso, slugId } from "./format.ts";
import {
  disclosuresFromBmnr,
  disclosuresFromMstr,
  parseBmnrExhibit,
  parseEtfHtml,
  parseMstr8k,
  stripRss,
} from "./parse.ts";
import { buildReconciliations } from "./rules.ts";
import type {
  Asset,
  Candle,
  CompanyHolding,
  DeskSnapshot,
  Disclosure,
  MemeCandidate,
  ModuleStatus,
  NewsItem,
  Quote,
  SocialPost,
} from "./types.ts";

const UA = "ResearchDesk/1.0 (investpan; research-desk@example.com)";
const ALLOW = new Set([
  "www.okx.com",
  "api.upbit.com",
  "api.coingecko.com",
  "api.dexscreener.com",
  "bykaranteli.com",
  "www.sec.gov",
  "data.sec.gov",
  "www.theblock.co",
  "www.coindesk.com",
]);

type Got = { ok: boolean; status: number; text: string; url: string };

export async function allowedGet(url: string, ms = 12000, headers: Record<string, string> = {}): Promise<Got> {
  const u = new URL(url);
  if (u.protocol !== "https:" || !ALLOW.has(u.hostname)) {
    return { ok: false, status: 0, text: "host not allowlisted", url };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": UA, accept: "application/json,text/html,application/xml,*/*", ...headers },
    });
    const text = (await res.text()).slice(0, 2_500_000);
    return { ok: res.ok, status: res.status, text, url };
  } catch (err) {
    return { ok: false, status: 0, text: err instanceof Error ? err.message : "fetch failed", url };
  } finally {
    clearTimeout(timer);
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => worker()));
  return out;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function fetchQuotes(assets: Asset[], now: string): Promise<{ quotes: Quote[]; krwPerUsdt: number | null; warnings: string[] }> {
  const warnings: string[] = [];
  const markets = await allowedGet("https://api.upbit.com/v1/market/all?isDetails=false", 10000);
  const listed = new Set<string>();
  if (markets.ok) {
    try {
      const rows = JSON.parse(markets.text) as { market: string }[];
      for (const r of rows) listed.add(r.market);
    } catch {
      warnings.push("업비트 마켓 목록 JSON을 읽지 못했습니다.");
    }
  } else warnings.push(`업비트 마켓 목록 실패 (${markets.status || markets.text}).`);

  const krwCodes = ["KRW-USDT", ...assets.flatMap((a) => [`KRW-${a.symbol}`, `USDT-${a.symbol}`])].filter((m) => listed.has(m));
  const upbitMap = new Map<string, { price: number; rate: number | null; value: number | null; ts: string }>();
  if (krwCodes.length) {
    const tick = await allowedGet(`https://api.upbit.com/v1/ticker?markets=${krwCodes.join(",")}`);
    if (tick.ok) {
      const rows = JSON.parse(tick.text) as {
        market: string;
        trade_price: number;
        signed_change_rate: number;
        acc_trade_price_24h: number;
        trade_timestamp: number;
      }[];
      for (const r of rows) {
        upbitMap.set(r.market, {
          price: r.trade_price,
          rate: r.signed_change_rate == null ? null : r.signed_change_rate * 100,
          value: r.acc_trade_price_24h,
          ts: new Date(r.trade_timestamp).toISOString(),
        });
      }
    } else warnings.push(`업비트 시세 실패 (${tick.status}).`);
  }
  const krwPerUsdt = upbitMap.get("KRW-USDT")?.price ?? null;

  const cgIds = assets.map((a) => CG_IDS[a.id]).filter(Boolean).join(",");
  const cgMap = new Map<string, { cap: number | null; supply: number | null; ch7: number | null }>();
  if (cgIds) {
    const cg = await allowedGet(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cgIds}&price_change_percentage=7d&per_page=50`,
    );
    if (cg.ok) {
      const rows = JSON.parse(cg.text) as {
        id: string;
        market_cap: number;
        circulating_supply: number;
        price_change_percentage_7d_in_currency: number;
      }[];
      for (const a of assets) {
        const row = rows.find((r) => r.id === CG_IDS[a.id]);
        if (!row) continue;
        cgMap.set(a.id, {
          cap: num(row.market_cap),
          supply: num(row.circulating_supply),
          ch7: num(row.price_change_percentage_7d_in_currency),
        });
      }
    } else warnings.push(`CoinGecko 시가총액 ${cg.status === 429 ? "호출 한도" : "실패"} (${cg.status}). 가격은 거래소 시세를 사용.`);
  }

  const quotes = await pool(assets, 6, async (asset): Promise<Quote> => {
    const empty: Quote = {
      assetId: asset.id,
      priceUsd: null,
      change24hPct: null,
      change7dPct: cgMap.get(asset.id)?.ch7 ?? null,
      volume24hUsd: null,
      marketCapUsd: cgMap.get(asset.id)?.cap ?? null,
      circulatingSupply: cgMap.get(asset.id)?.supply ?? null,
      high24h: null,
      low24h: null,
      venue: "없음",
      asOf: now,
      krwPrice: upbitMap.get(`KRW-${asset.symbol}`)?.price ?? null,
      krwPerUsdt,
      premiumPct: null,
      premiumNote: "업비트 KRW 최근체결과 USDT 환율. 동시 호가가 아닌 참고치.",
      fundingRate: null,
      fundingTime: null,
      openInterestUsd: null,
      contractMultiplier: null,
      perpAvailable: false,
      upbitKrw: listed.has(`KRW-${asset.symbol}`),
      upbitUsdt: listed.has(`USDT-${asset.symbol}`),
      sourceUrl: "https://www.okx.com/api/v5/market/ticker",
    };
    if (asset.okxSpot) {
      const t = await allowedGet(`https://www.okx.com/api/v5/market/ticker?instId=${asset.okxSpot}`);
      if (t.ok) {
        const row = (JSON.parse(t.text) as { data?: Record<string, string>[] }).data?.[0];
        if (row) {
          const last = num(row.last);
          const open = num(row.open24h);
          empty.priceUsd = last;
          empty.change24hPct = last != null && open ? ((last - open) / open) * 100 : null;
          empty.high24h = num(row.high24h);
          empty.low24h = num(row.low24h);
          empty.volume24hUsd = num(row.volCcy24h);
          empty.asOf = row.ts ? new Date(Number(row.ts)).toISOString() : now;
          empty.venue = "OKX spot";
        }
      }
    }
    if (asset.okxSwap) {
      const [inst, fund, oi] = await Promise.all([
        allowedGet(`https://www.okx.com/api/v5/public/instruments?instType=SWAP&instId=${asset.okxSwap}`),
        allowedGet(`https://www.okx.com/api/v5/public/funding-rate?instId=${asset.okxSwap}`),
        allowedGet(`https://www.okx.com/api/v5/public/open-interest?instId=${asset.okxSwap}`),
      ]);
      if (inst.ok) {
        const row = (JSON.parse(inst.text) as { data?: { ctVal?: string }[] }).data?.[0];
        if (row) {
          empty.perpAvailable = true;
          empty.contractMultiplier = num(row.ctVal);
        }
      }
      if (fund.ok) {
        const row = (JSON.parse(fund.text) as { data?: { fundingRate?: string; fundingTime?: string }[] }).data?.[0];
        empty.fundingRate = num(row?.fundingRate);
        empty.fundingTime = row?.fundingTime ? new Date(Number(row.fundingTime)).toISOString() : null;
      }
      if (oi.ok) {
        const row = (JSON.parse(oi.text) as { data?: { oiUsd?: string }[] }).data?.[0];
        empty.openInterestUsd = num(row?.oiUsd);
      }
    }
    if (asset.okxSpot && empty.priceUsd == null && asset.okxSwap) {
      const swap = await allowedGet(`https://www.okx.com/api/v5/market/ticker?instId=${asset.okxSwap}`);
      if (swap.ok) {
        const row = (JSON.parse(swap.text) as { data?: Record<string, string>[] }).data?.[0];
        const last = num(row?.last);
        const open = num(row?.open24h);
        if (last != null) {
          empty.priceUsd = last;
          empty.change24hPct = open ? ((last - open) / open) * 100 : null;
          empty.volume24hUsd = num(row?.volCcy24h);
          empty.venue = "OKX USDT-M (현물 티커 없음)";
          empty.asOf = row?.ts ? new Date(Number(row.ts)).toISOString() : now;
          empty.sourceUrl = "https://www.okx.com/api/v5/market/ticker";
        }
      }
    }
    const krw = empty.krwPrice;
    const usdtPx = upbitMap.get(`USDT-${asset.symbol}`)?.price ?? empty.priceUsd;
    if (krw && usdtPx && krwPerUsdt) {
      empty.premiumPct = (krw / (usdtPx * krwPerUsdt) - 1) * 100;
    }
    return empty;
  });
  return { quotes, krwPerUsdt, warnings };
}

export async function fetchCandles(assets: Asset[]): Promise<Record<string, Candle[]>> {
  const candles: Record<string, Candle[]> = {};
  await pool(assets.filter((a) => a.okxSpot), 5, async (asset) => {
    let inst = asset.okxSpot;
    let res = inst ? await allowedGet(`https://www.okx.com/api/v5/market/candles?instId=${inst}&bar=1Dutc&limit=40`) : null;
    let rows = res?.ok ? ((JSON.parse(res.text) as { data?: string[][] }).data ?? []) : [];
    if (!rows.length && asset.okxSwap) {
      inst = asset.okxSwap;
      res = await allowedGet(`https://www.okx.com/api/v5/market/candles?instId=${asset.okxSwap}&bar=1Dutc&limit=40`);
      rows = res.ok ? ((JSON.parse(res.text) as { data?: string[][] }).data ?? []) : [];
    }
    if (!rows.length) return;
    candles[asset.id] = rows
      .map((r) => ({
        t: Number(r[0]),
        o: Number(r[1]),
        h: Number(r[2]),
        l: Number(r[3]),
        c: Number(r[4]),
        v: Number(r[6]),
      }))
      .filter((c) => Number.isFinite(c.t) && Number.isFinite(c.c))
      .sort((a, b) => a.t - b.t);
  });
  return candles;
}

const ETF_ASSET: Record<string, string> = {
  btc: "btc",
  eth: "eth",
  sol: "sol",
  xrp: "xrp",
  doge: "doge",
  link: "link",
  hbar: "hbar",
  ltc: "ltc",
  avax: "avax",
  sui: "sui",
  dot: "dot",
};

export async function fetchEtf(now: string) {
  const index = await allowedGet("https://bykaranteli.com/etf", 15000);
  const slugs = index.ok
    ? [...new Set([...index.text.matchAll(/href="\/etf\/([a-z0-9]+)"/g)].map((m) => m[1]))]
    : ["btc", "eth", "sol", "xrp"];
  const pages = await pool(slugs, 3, async (slug) => {
    const url = `https://bykaranteli.com/etf/${slug}`;
    const res = await allowedGet(url, 15000);
    return { slug, url, res };
  });
  const products = [];
  const sessions = [];
  const heat = [];
  const extraAssets: Asset[] = [];
  for (const page of pages) {
    if (!page.res.ok || !page.res.text.includes("<table")) continue;
    const assetId = ETF_ASSET[page.slug] ?? page.slug;
    if (!SEED_ASSETS.some((a) => a.id === assetId)) {
      extraAssets.push({
        id: assetId,
        symbol: page.slug.toUpperCase(),
        name: page.slug.toUpperCase(),
        nameKo: page.slug.toUpperCase(),
        themes: ["ETF"],
        okxSpot: `${page.slug.toUpperCase()}-USDT`,
        okxSwap: `${page.slug.toUpperCase()}-USDT-SWAP`,
        contract: null,
        identity: "unresolved",
      });
    }
    const parsed = parseEtfHtml(page.res.text, assetId, page.url);
    products.push(...parsed.products);
    sessions.push(...parsed.sessions);
    heat.push(...parsed.heat);
  }
  const sec = await allowedGet(
    "https://www.sec.gov/newsroom/press-releases/2025-121-sec-approves-generic-listing-standards-commodity-based-trust-shares",
    12000,
    { "user-agent": UA, accept: "text/html" },
  );
  const secDate = sec.ok ? (monthDateToIso(/([A-Z][a-z]+ \d{1,2}, 2025)/.exec(sec.text)?.[1] ?? "") ?? null) : null;
  return {
    ok: products.length > 0,
    extraAssets,
    status: index.ok ? "live" : "failed",
    detail: index.ok
      ? `ByKaranteli 공개 페이지 ${slugs.join(", ")}. 업스트림은 페이지가 Farside 계열 일별 순유입으로 밝힌 표. Farside 원문은 이 환경에서 Cloudflare 403.`
      : `ETF 인덱스 실패 (${index.status}). ${index.text.slice(0, 120)}`,
    etf: {
      provenance: {
        source: "ByKaranteli public ETF pages",
        url: "https://bykaranteli.com/etf",
        retrievedAt: now,
        asOf: sessions[0]?.date ?? null,
        kind: "live" as const,
        note: "순유입은 페이지의 daily net flow. 거래대금·AUM은 별도 열. SoSoValue 키 없음.",
      },
      products,
      sessions,
      heat,
      milestones: [
        {
          id: "sec-generic-2025-121",
          assetId: null,
          ticker: null,
          title: "SEC 상품 기반 신탁 일반 상장 기준 보도자료",
          date: secDate,
          uncertainty: secDate ? "보도자료 본문에서 날짜 문구를 읽음. 개별 펀드 효력 발생일은 아님." : "본문 날짜를 확인하지 못함. 링크만 남김.",
          url: "https://www.sec.gov/newsroom/press-releases/2025-121-sec-approves-generic-listing-standards-commodity-based-trust-shares",
          summary: "일반 상장 기준 뉴스다. 이미 상장된 펀드를 개별 19b-4 일정으로 재배열하지 않음.",
        },
        ...products.slice(0, 8).map((p) => ({
          id: `listed-${p.assetId}-${p.ticker}`,
          assetId: p.assetId,
          ticker: p.ticker,
          title: `${p.ticker} ${p.issuer} 행이 미국 현물 자금 표에 있음`,
          date: p.sessionDate,
          uncertainty: "상장 효력일이 아니라 출처 페이지가 보여주는 최근 세션.",
          url: p.sourceUrl,
          summary: p.tradingState === "reported" ? "최근 세션 숫자가 있음." : "행은 있으나 최근 일일 흐름이 결측.",
        })),
      ],
      coverageNote: `발견 슬러그 ${slugs.join(", ") || "없음"}. 홍콩·레버리지·선물 ETF는 이 표에 없으면 포함하지 않음.`,
    },
  };
}

function secDocUrl(cik: number, accession: string, doc: string): string {
  const nodash = accession.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${cik}/${nodash}/${doc}`;
}

export async function fetchDat(now: string, previous: CompanyHolding[] = []): Promise<{
  holdings: CompanyHolding[];
  disclosures: Disclosure[];
  detail: string;
  state: ModuleStatus["state"];
}> {
  const holdings: CompanyHolding[] = [];
  const notes: string[] = [];
  for (const coin of ["bitcoin", "ethereum"] as const) {
    const assetId = coin === "bitcoin" ? "btc" : "eth";
    const res = await allowedGet(`https://api.coingecko.com/api/v3/companies/public_treasury/${coin}`);
    if (!res.ok) {
      const kept = previous.filter((h) => h.assetId === assetId);
      holdings.push(...kept);
      notes.push(
        `${coin} 디렉터리 ${res.status === 429 ? "CoinGecko 한도" : "실패"} (${res.status}). ${kept.length ? `이전 스냅샷 ${kept.length}행 유지.` : "이전 행 없음."}`,
      );
      continue;
    }
    const body = JSON.parse(res.text) as {
      companies: {
        name: string;
        symbol: string;
        country: string;
        total_holdings: number;
        total_entry_value_usd: number;
        total_current_value_usd: number;
        percentage_of_total_supply: number;
      }[];
    };
    for (const c of body.companies ?? []) {
      if (/government|el salvador|bhutan/i.test(c.name)) continue;
      const entry = c.total_entry_value_usd > 0 ? c.total_entry_value_usd : null;
      holdings.push({
        companyId: slugId(c.symbol || c.name, c.name),
        name: c.name,
        ticker: c.symbol || "",
        country: c.country || "",
        kind: companyKind(c.symbol || "", c.name),
        assetId,
        holdings: c.total_holdings,
        entryValueUsd: entry,
        currentValueUsd: c.total_current_value_usd ?? null,
        supplySharePct: c.percentage_of_total_supply ?? null,
        asOf: null,
        source: "CoinGecko public treasury",
        url: `https://api.coingecko.com/api/v3/companies/public_treasury/${coin}`,
        retrievedAt: now,
      });
    }
  }

  const disclosures: Disclosure[] = [];
  const secHeaders = { "user-agent": UA, accept: "text/html,application/json" };
  const mstrSub = await allowedGet("https://data.sec.gov/submissions/CIK0001050446.json", 15000, secHeaders);
  if (mstrSub.ok) {
    const sub = JSON.parse(mstrSub.text) as {
      filings: { recent: { form: string[]; accessionNumber: string[]; primaryDocument: string[]; filingDate: string[] } };
    };
    const recent = sub.filings.recent;
    let parsedOne = false;
    for (let i = 0; i < recent.form.length && !parsedOne && i < 12; i++) {
      if (recent.form[i] !== "8-K") continue;
      const url = secDocUrl(1050446, recent.accessionNumber[i], recent.primaryDocument[i]);
      const doc = await allowedGet(url, 15000, secHeaders);
      if (!doc.ok) continue;
      const parsed = parseMstr8k(doc.text);
      if (!parsed.balances.length) continue;
      disclosures.push(...disclosuresFromMstr(parsed, recent.filingDate[i], url, now));
      parsedOne = true;
    }
    if (!parsedOne) notes.push("Strategy 최근 8-K에서 BTC 보유 표를 찾지 못함.");
  } else notes.push(`SEC Strategy submissions 실패 (${mstrSub.status}).`);

  const bmnrSub = await allowedGet("https://data.sec.gov/submissions/CIK0001829311.json", 15000, secHeaders);
  if (bmnrSub.ok) {
    const sub = JSON.parse(bmnrSub.text) as {
      filings: { recent: { form: string[]; accessionNumber: string[]; filingDate: string[] } };
    };
    const recent = sub.filings.recent;
    let found = 0;
    for (let i = 0; i < recent.form.length && found < 3 && i < 10; i++) {
      if (!recent.form[i].startsWith("8-K")) continue;
      const acc = recent.accessionNumber[i];
      const indexUrl = secDocUrl(1829311, acc, `${acc}-index.html`);
      const index = await allowedGet(indexUrl, 15000, secHeaders);
      if (!index.ok) continue;
      const ex = /href="([^"]*ex99-1\.htm)"/i.exec(index.text);
      if (!ex) continue;
      const exUrl = new URL(ex[1], indexUrl).toString();
      if (!exUrl.startsWith("https://www.sec.gov/")) continue;
      const exhibit = await allowedGet(exUrl, 15000, secHeaders);
      if (!exhibit.ok) continue;
      const parsed = parseBmnrExhibit(exhibit.text);
      const rows = disclosuresFromBmnr(parsed, recent.filingDate[i], exUrl, now);
      if (!rows.length) continue;
      disclosures.push(...rows);
      found += 1;
    }
    if (!found) notes.push("Bitmine 8-K exhibit에서 ETH 수량을 찾지 못함.");
  } else notes.push(`SEC Bitmine submissions 실패 (${bmnrSub.status}).`);

  const state: ModuleStatus["state"] = holdings.length || disclosures.length ? (notes.length ? "partial" : "live") : "failed";
  return {
    holdings,
    disclosures,
    state,
    detail: notes.join(" ") || "CoinGecko 디렉터리와 SEC 8-K 파싱.",
  };
}

async function dexCandidates(symbol: string): Promise<{ chain: string; address: string; liq: number; vol: number; dex: string }[]> {
  const res = await allowedGet(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}`);
  if (!res.ok) return [];
  const pairs = (JSON.parse(res.text) as {
    pairs?: {
      chainId: string;
      dexId: string;
      baseToken?: { symbol?: string; address?: string };
      liquidity?: { usd?: number };
      volume?: { h24?: number };
    }[];
  }).pairs ?? [];
  const best = new Map<string, { chain: string; address: string; liq: number; vol: number; dex: string }>();
  for (const p of pairs) {
    if ((p.baseToken?.symbol || "").toUpperCase() !== symbol.toUpperCase()) continue;
    const address = p.baseToken?.address;
    if (!address) continue;
    const key = `${p.chainId}:${address}`;
    const vol = p.volume?.h24 ?? 0;
    const prev = best.get(key);
    const row = { chain: p.chainId, address, liq: p.liquidity?.usd ?? 0, vol, dex: p.dexId };
    if (!prev || row.vol > prev.vol) best.set(key, row);
  }
  return [...best.values()].sort((a, b) => b.vol - a.vol).slice(0, 4);
}

export async function buildMemes(
  assets: Asset[],
  quotes: Quote[],
  posts: SocialPost[],
  now: string,
): Promise<{ assets: Asset[]; memes: MemeCandidate[] }> {
  const SKIP_MEME = new Set(["BTC", "BITCOIN", "ETH", "ETHEREUM", "SOL", "SOLANA", "XRP", "MSTR", "STRC", "STRK", "STRF", "STRD", "BMNR", "BMNP"]);
  const mentioned = new Set<string>();
  for (const p of posts) {
    for (const t of p.tokens) {
      const sym = t.replace(/^\$/, "").toUpperCase();
      if (!SKIP_MEME.has(sym)) mentioned.add(sym);
    }
  }
  const extras: Asset[] = [];
  for (const sym of mentioned) {
    if (["MSTR", "STRC", "STRK", "STRF", "STRD", "BMNR", "BMNP"].includes(sym)) continue;
    if (assets.some((a) => a.symbol.toUpperCase() === sym) || extras.some((a) => a.symbol === sym)) continue;
    extras.push({
      id: sym.toLowerCase(),
      symbol: sym,
      name: sym,
      nameKo: sym,
      themes: ["밈"],
      okxSpot: `${sym}-USDT`,
      okxSwap: `${sym}-USDT-SWAP`,
      contract: null,
      identity: "unresolved",
    });
  }
  const universe = [...assets, ...extras];
  const memeAssets = universe.filter((a) => a.themes.includes("밈") || mentioned.has(a.symbol));
  const memes: MemeCandidate[] = [];
  for (const asset of memeAssets) {
    const dex = asset.identity === "native" ? [] : await dexCandidates(asset.symbol);
    const top = dex[0];
    const second = dex[1];
    const keepSeed = Boolean(asset.contract) && asset.id === "pepe";
    const collision = !keepSeed && asset.identity !== "native" && Boolean(top && second && second.vol > 10_000 && top.vol < second.vol * 5);
    if (top && !collision && !keepSeed && asset.identity !== "native") {
      asset.contract = {
        chain: top.chain,
        address: top.address,
        note: "DEX Screener에서 심볼이 같고 24h 거래량이 다음 민트의 5배를 넘은 주소. 게시물 안 컨트랙트 대조는 아님.",
      };
    }
    const quote = quotes.find((q) => q.assetId === asset.id);
    const authors = [...new Set(posts.filter((p) => p.tokens.some((t) => t.replace(/^\$/, "").toUpperCase() === asset.symbol)).map((p) => p.handle))];
    const first = posts.find((p) => p.tokens.some((t) => t.replace(/^\$/, "").toUpperCase() === asset.symbol));
    memes.push({
      assetId: asset.id,
      mention: first ? `@${first.handle}` : null,
      firstObserved: first?.published ?? (authors.length ? now : null),
      authors,
      originClusters: authors.length,
      attentionNote: authors.length
        ? `관측 표본 ${authors.length}개 계정. 7일 비교창이 없어 급등 아님.`
        : "이 스냅샷의 X 표본에 티커 언급 없음. 언급 없음이 침묵의 증거는 아님.",
      volume24hUsd: quote?.volume24hUsd ?? top?.vol ?? null,
      liquidityUsd: top?.liq ?? null,
      liquidityKind: quote?.volume24hUsd ? "order-book-volume" : top ? "dex-pool" : "unknown",
      priceReactionNote: quote?.change24hPct == null ? "가격 반응을 계산할 시세 없음." : `OKX 또는 연결 시세 24h ${quote.change24hPct.toFixed(2)}%. 언급 시각의 분봉은 없음.`,
      spotVenues: [quote?.priceUsd != null ? "OKX spot" : null, quote?.upbitKrw ? "Upbit KRW" : null, top ? top.dex : null].filter((v): v is string => Boolean(v)),
      perpVenues: quote?.perpAvailable ? [`OKX USDT-M x${quote.contractMultiplier ?? 1}`] : [],
      contractMultiplier: quote?.contractMultiplier ?? null,
      krwListed: Boolean(quote?.upbitKrw),
      risk: asset.identity === "native"
        ? "네이티브 자산. DEX의 동명 랩드 토큰을 이 코인의 민트로 쓰지 않음."
        : collision
          ? `동일 심볼 민트가 여럿. 거래량 상위 ${dex.map((d) => `${d.chain}:${d.address.slice(0, 8)}… 거래량 ${Math.round(d.vol)}`).join(" / ")}. 하나로 확정하지 않음.`
          : "민트 권한·동결·보유 집중은 검증하지 않음. 미확인은 안전이 아님.",
      reason: first
        ? `@${first.handle} 원문 언급. 투자 권유로 읽지 않음.`
        : "선물 또는 현물 시세가 있는 밈 후보. 소셜 급등과 분리.",
      identityNote: asset.identity === "native"
        ? "native"
        : collision
          ? "복수 컨트랙트"
          : asset.contract
            ? `${asset.contract.chain} ${asset.contract.address}`
            : "컨트랙트 미연결",
      poolCount: dex.length || null,
    });
  }
  return { assets: extras, memes };
}

export function newsFromDisclosures(disclosures: Disclosure[], now: string): NewsItem[] {
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const d of disclosures) {
    if (seen.has(d.sourceUrl + d.assetId + d.classification)) continue;
    seen.add(d.sourceUrl + d.assetId + d.classification);
    items.push({
      id: `disc-${d.id}`,
      title: d.classification === "purchase" ? `${d.companyId.toUpperCase()} 매수 공시` : `${d.companyId.toUpperCase()} 보유 공시`,
      source: "SEC EDGAR",
      url: d.sourceUrl,
      published: d.published,
      firstSeen: now,
      category: d.classification === "purchase" ? "financing" : "token supply",
      assetIds: [d.assetId],
      excerpt: d.excerpt,
      summaryKo: d.excerpt,
      whatsNew: "공시 원문에서 파싱한 수량. 디렉터리 스냅샷과 숫자가 다르면 둘 다 남기고 평균내지 않음.",
      route: "disclosure",
      counter: "회사 보도자료·8-K는 회사 주장. 거래소 잔고로 재검증하지 않음.",
    });
  }
  return items;
}

export async function fetchHeadlines(now: string): Promise<{ items: NewsItem[]; detail: string }> {
  const feeds = [
    ["The Block", "https://www.theblock.co/rss.xml"],
    ["CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"],
  ] as const;
  const items: NewsItem[] = [];
  const notes: string[] = [];
  for (const [source, url] of feeds) {
    const res = await allowedGet(url, 10000);
    if (!res.ok) {
      notes.push(`${source} ${res.status || "실패"}`);
      continue;
    }
    const rows = stripRss(res.text);
    if (!rows.length) {
      notes.push(`${source} 항목 0`);
      continue;
    }
    for (const row of rows.slice(0, 8)) {
      const published = row.date ? new Date(row.date).toISOString() : null;
      items.push({
        id: `rss-${source}-${row.link}`,
        title: row.title,
        source,
        url: row.link,
        published: published && !Number.isNaN(Date.parse(published)) ? published : null,
        firstSeen: now,
        category: "narrative",
        assetIds: guessAssets(row.title),
        excerpt: row.title,
        summaryKo: "원문 제목만 표시. 본문 번역은 하지 않음.",
        whatsNew: "헤드라인. 수치가 있으면 원문에서 확인.",
        route: "news",
        counter: "통신사 기사. 공시와 별개이며 사실 확정으로 쓰지 않음.",
      });
    }
  }
  return { items, detail: notes.length ? notes.join(", ") : "RSS 수신" };
}

function guessAssets(title: string): string[] {
  const t = title.toUpperCase();
  const ids: string[] = [];
  if (t.includes("BITCOIN") || /\bBTC\b/.test(t)) ids.push("btc");
  if (t.includes("ETHEREUM") || /\bETH\b/.test(t)) ids.push("eth");
  if (/\bSOLANA\b|\bSOL\b/.test(t)) ids.push("sol");
  if (/\bXRP\b/.test(t)) ids.push("xrp");
  return ids;
}

export function socialFromFile(raw: string, retrievedAt: string): SocialPost[] {
  const body = JSON.parse(raw) as {
    posts?: {
      handle: string;
      url?: string;
      published?: string | null;
      kind?: string;
      text?: string;
      tokens?: string[];
      contracts?: string[];
      disclosure?: string | null;
    }[];
  };
  return (body.posts ?? [])
    .filter((p) => p.handle && p.text && p.url)
    .map((p) => {
      const kind = p.kind === "reply" || p.kind === "repost" || p.kind === "original" ? p.kind : "unknown";
      const tokens = p.tokens ?? [];
      const label = kind === "reply" ? "답글" : kind === "repost" ? "재게시" : kind === "original" ? "원글" : "구분 불명";
      return {
        id: p.url || `${p.handle}-${p.published}`,
        handle: p.handle.replace(/^@/, ""),
        url: p.url ?? null,
        published: p.published ?? null,
        kind,
        text: p.text ?? "",
        summaryKo: `${label}. ${tokens.length ? `언급 ${tokens.join(" ")}. ` : ""}원문 유지. 자동 번역 없음.`,
        tokens,
        contracts: p.contracts ?? [],
        disclosure: p.disclosure ?? null,
        firstSeen: retrievedAt,
      };
    });
}

export async function acquireDesk(
  xPostsPath?: string,
  previousHoldings: CompanyHolding[] = [],
  existingSocial?: DeskSnapshot["social"],
): Promise<DeskSnapshot> {
  const now = new Date().toISOString();
  const warnings: DeskSnapshot["warnings"] = [
    {
      level: "info",
      scope: "market",
      message: "Binance 현물 API는 이 환경에서 451이라 OKX 현물·선물과 업비트를 사용합니다.",
    },
  ];
  const modules: ModuleStatus[] = [];
  let assets = SEED_ASSETS.map((a) => ({ ...a }));
  const etfResult = await fetchEtf(now);
  for (const extra of etfResult.extraAssets) {
    if (!assets.some((a) => a.id === extra.id)) assets.push(extra);
  }
  const quoteResult = await fetchQuotes(assets, now);
  warnings.push(...quoteResult.warnings.map((message) => ({ level: "warn" as const, scope: "market", message })));
  const candles = await fetchCandles(assets);
  const dat = await fetchDat(now, previousHoldings);
  const headlines = await fetchHeadlines(now);
  let posts: SocialPost[] = existingSocial?.posts ?? [];
  let socialNote = posts.length ? "이전 X 스냅샷을 유지. 이 새로고침에서는 X를 다시 호출하지 않음." : "X 검색 스냅샷 없음";
  if (xPostsPath) {
    try {
      posts = socialFromFile(await readFile(xPostsPath, "utf8"), now);
      socialNote = `저장된 X 검색 ${posts.length}건. 페이지를 열 때마다 다시 호출하지 않음.`;
    } catch {
      socialNote = "X 포스트 파일을 읽지 못함.";
    }
  }
  const memes = await buildMemes(assets, quoteResult.quotes, posts, now);
  for (const extra of memes.assets) {
    if (!assets.some((a) => a.id === extra.id)) assets.push(extra);
  }
  if (memes.assets.length) {
    const extraQuotes = await fetchQuotes(memes.assets, now);
    quoteResult.quotes.push(...extraQuotes.quotes);
    const extraCandles = await fetchCandles(memes.assets);
    Object.assign(candles, extraCandles);
  }
  for (const meme of memes.memes) {
    const quote = quoteResult.quotes.find((q) => q.assetId === meme.assetId);
    if (!quote) continue;
    meme.krwListed = Boolean(quote.upbitKrw);
    meme.contractMultiplier = quote.contractMultiplier;
    meme.perpVenues = quote.perpAvailable ? [`OKX USDT-M 계약면 ${quote.contractMultiplier ?? "?"} ${meme.assetId.toUpperCase()}`] : [];
    if (quote.volume24hUsd != null) {
      meme.volume24hUsd = quote.volume24hUsd;
      meme.liquidityKind = quote.venue.startsWith("OKX") ? "order-book-volume" : meme.liquidityKind;
    }
    meme.priceReactionNote =
      quote.change24hPct == null
        ? "가격 반응을 계산할 시세 없음."
        : `${quote.venue} 24h ${quote.change24hPct.toFixed(2)}%. 언급 시각의 분봉은 없어 발표 직후 반응과 구분하지 않음.`;
    meme.spotVenues = [quote.priceUsd != null ? quote.venue : null, quote.upbitKrw ? "Upbit KRW" : null].filter((v): v is string => Boolean(v));
  }
  const disclosures = dat.disclosures.map((d) => ({
    ...d,
    asOf: d.asOf.length === 10 ? etDateTime(d.asOf, d.companyId === "bmnr" ? 18 : 16, d.companyId === "bmnr" ? 30 : 0) : d.asOf,
  }));
  const news = [...newsFromDisclosures(disclosures, now), ...headlines.items];
  const dedup = new Map<string, NewsItem>();
  for (const n of news) if (!dedup.has(n.url + n.title)) dedup.set(n.url + n.title, n);

  modules.push(
    {
      id: "market",
      label: "시세",
      state: quoteResult.quotes.some((q) => q.priceUsd != null) ? "live" : "failed",
      detail: "OKX ticker/candles, Upbit KRW·USDT, CoinGecko 시총(가능 시).",
      checkedAt: now,
    },
    {
      id: "etf",
      label: "ETF",
      state: etfResult.ok ? "live" : "failed",
      detail: etfResult.detail,
      checkedAt: now,
    },
    {
      id: "dat",
      label: "기업 보유",
      state: dat.state,
      detail: dat.detail,
      checkedAt: now,
    },
    {
      id: "news",
      label: "뉴스",
      state: dedup.size ? "live" : "failed",
      detail: headlines.detail,
      checkedAt: now,
    },
    {
      id: "x",
      label: "X",
      state: posts.length ? "snapshot" : "failed",
      detail: socialNote,
      checkedAt: now,
    },
  );

  return {
    generatedAt: now,
    mode: "live",
    warnings,
    modules,
    assets,
    quotes: quoteResult.quotes,
    candles,
    etf: etfResult.etf,
    dat: {
      provenance: {
        source: "CoinGecko public treasury + SEC EDGAR",
        url: "https://www.sec.gov/edgar/search/",
        retrievedAt: now,
        asOf: disclosures[0]?.asOf ?? null,
        kind: dat.state === "live" ? "live" : "snapshot",
        note: "디렉터리 수량은 회사별 최신값의 합성. 같은 날 잔고가 아님. SEC 수량이 있으면 그 공시를 우선 서술하고 합성 합계에 두 번 넣지 않음.",
      },
      holdings: dat.holdings,
      disclosures,
      reconciliations: buildReconciliations(disclosures),
      coverageNote:
        "CoinGecko 공개 트레저리 목록에 있는 회사만. DeFi Development Corp(DFDV)이 응답에 없으면 보유를 만들지 않음. 채굴·거래소·운영회사는 트레저리 합계에서 제외.",
    },
    news: [...dedup.values()],
    social: {
      provenance: posts.length
        ? {
            source: "xAI X Search",
            url: "https://docs.x.ai/developers/tools/x-search",
            retrievedAt: now,
            asOf: posts[0]?.published ?? null,
            kind: "snapshot",
            note: "허용 핸들 theunipcs, saylor. 투자 실력 가정 없음. 지갑 연결 없음.",
          }
        : null,
      posts,
      blockedReason: posts.length ? null : socialNote,
    },
    memes: memes.memes,
    krwPerUsdt: quoteResult.krwPerUsdt,
  };
}
