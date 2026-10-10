import bundledCatalog from "../../data/etf-catalog.json" with { type: "json" };
import { dedupeEtfRecords, mergeEtfCatalog, normalizeEtfCatalog, recordsFromFlows } from "./etf.ts";
import type { Asset, CryptoEtfRecord, DeskSnapshot, EtfCatalog } from "./types.ts";

async function boundedText(response: Response, limit = 2_500_000): Promise<string> {
  if (!response.ok) throw new Error(`출처 HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("출처 본문 없음");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > limit) throw new Error("출처 크기 제한 초과");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sourceText(text: string): string {
  return text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(x[\da-f]+|\d+);/gi, (entity, code: string) => {
      const point = code.toLowerCase().startsWith("x")
        ? parseInt(code.slice(1), 16)
        : parseInt(code, 10);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
        ? String.fromCodePoint(point)
        : entity;
    })
    .replace(
      /&(?:nbsp|amp|quot|apos|lt|gt|ndash|mdash|lsquo|rsquo|ldquo|rdquo);/g,
      (e) =>
        ({
          "&nbsp;": " ",
          "&amp;": "&",
          "&quot;": '"',
          "&apos;": "'",
          "&lt;": "<",
          "&gt;": ">",
          "&ndash;": "–",
          "&mdash;": "—",
          "&lsquo;": "‘",
          "&rsquo;": "’",
          "&ldquo;": "“",
          "&rdquo;": "”",
        })[e] ?? e,
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const OFFICIAL_HOSTS = [
  "www.sec.gov",
  "data.sec.gov",
  "www.nasdaq.com",
  "www.nasdaqtrader.com",
  "listingcenter.nasdaq.com",
  "www.nyse.com",
  "www.cboe.com",
];

async function verifyPrimaryRecords(
  records: CryptoEtfRecord[],
  hosts: string[],
  fetcher: typeof fetch,
  now: string,
) {
  const documents = new Map<string, Promise<string>>();
  const signal = AbortSignal.timeout(30000);
  const verified: CryptoEtfRecord[] = [];
  let cursor = 0;
  async function document(url: string): Promise<string> {
    let pending = documents.get(url);
    if (pending) return pending;
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      (u.port && u.port !== "443") ||
      ![...OFFICIAL_HOSTS, ...hosts].includes(u.hostname)
    )
      throw new Error("일차 출처 호스트가 허용되지 않음");
    if (documents.size >= 100) throw new Error("한 번의 갱신에서 일차 문서 100개 확인 한도");
    pending = fetcher(u, {
      headers: {
        accept: "text/html,text/plain,application/json",
        "user-agent": "CryptoResearchDesk/1.0",
      },
      redirect: "error",
      signal,
    })
      .then((response) => boundedText(response, 8 * 1024 * 1024))
      .then(sourceText);
    documents.set(url, pending);
    return pending;
  }
  async function worker() {
    while (cursor < records.length) {
      const index = cursor++;
      const record = records[index];
      if (
        record.status === "unverified" ||
        !record.statusAsOf ||
        record.statusAsOf > now.slice(0, 10)
      ) {
        verified[index] = {
          ...record,
          status: "unverified",
          lastVerifiedAt: null,
          evidence: record.evidence.map((e) => ({ ...e, verifiedAt: null })),
        };
        continue;
      }
      let proof = false;
      const evidence = [];
      for (const e of record.evidence) {
        if (
          e.authority === "secondary" ||
          e.status !== record.status ||
          e.asOf !== record.statusAsOf ||
          !e.excerpt
        ) {
          evidence.push({ ...e, verifiedAt: null });
          continue;
        }
        try {
          const body = await document(e.url);
          const excerpt = sourceText(e.excerpt);
          if (!excerpt || !body.includes(excerpt))
            throw new Error("상태 발췌문을 원문에서 찾지 못함");
          evidence.push({ ...e, verifiedAt: now });
          proof = true;
        } catch {
          evidence.push({ ...e, verifiedAt: null });
        }
      }
      verified[index] = proof
        ? { ...record, evidence, lastVerifiedAt: now }
        : {
            ...record,
            evidence,
            status: "unverified",
            lastVerifiedAt: null,
            note: [
              record.note,
              "이번 갱신에서 일차 원문의 상태 발췌문을 확인하지 못함. 기존 확인 기록은 별도 유지.",
            ]
              .filter(Boolean)
              .join(" "),
          };
    }
  }
  await Promise.all([worker(), worker()]);
  return verified;
}

export function catalogWithFlows(etf: DeskSnapshot["etf"], assets: Asset[]): EtfCatalog {
  const saved = normalizeEtfCatalog(bundledCatalog);
  const catalog = etf.catalog ? mergeEtfCatalog(saved, normalizeEtfCatalog(etf.catalog)) : saved;
  const observations = recordsFromFlows(etf.products, assets, etf.provenance.asOf);
  // Match measurements to an identified single-asset product without upgrading their status.
  const unmatched = observations.filter(
    (row) =>
      !catalog.records.some(
        (r) =>
          r.ticker &&
          r.ticker === row.ticker &&
          r.jurisdiction === row.jurisdiction &&
          r.productType !== "basket" &&
          !r.multiAsset &&
          r.underlyingAssets.length === 1 &&
          r.underlyingAssets[0].assetId === row.underlyingAssets[0].assetId,
      ),
  );
  return {
    ...catalog,
    records: reconcileFlowRecords(dedupeEtfRecords([...catalog.records, ...unmatched])),
  };
}

function reconcileFlowRecords(records: CryptoEtfRecord[]): CryptoEtfRecord[] {
  return records.filter(
    (row) =>
      !row.id.startsWith("flow:") ||
      !records.some(
        (r) =>
          !r.id.startsWith("flow:") &&
          r.ticker &&
          r.ticker === row.ticker &&
          r.jurisdiction === row.jurisdiction &&
          r.productType !== "basket" &&
          !r.multiAsset &&
          r.underlyingAssets.length === 1 &&
          row.underlyingAssets.length === 1 &&
          r.underlyingAssets[0].assetId === row.underlyingAssets[0].assetId,
      ),
  );
}

/** Discover coin identities from records; ETF discovery never invents venue pairs. */
export function catalogAssets(records: CryptoEtfRecord[], existing: Asset[]): Asset[] {
  const assets = new Map(existing.map((a) => [a.id, a]));
  for (const record of records)
    for (const underlying of record.underlyingAssets) {
      if (assets.has(underlying.assetId)) continue;
      assets.set(underlying.assetId, {
        id: underlying.assetId,
        symbol: underlying.symbol,
        name: underlying.name ?? underlying.symbol,
        nameKo: underlying.name ?? underlying.symbol,
        themes: ["ETF"],
        okxSpot: null,
        okxSwap: null,
        contract: null,
        identity: "unresolved",
      });
    }
  return [...assets.values()];
}

/** A deployment can supply its reviewed normalized source registry through a server-only HTTPS feed. */
export async function refreshCatalog(
  previous: EtfCatalog,
  options: {
    url?: string;
    allowedHosts?: string[];
    fetcher?: typeof fetch;
    now?: string;
  } = {},
): Promise<EtfCatalog> {
  const now = options.now ?? new Date().toISOString();
  const url = options.url ?? process.env.ETF_CATALOG_URL;
  if (!url)
    return {
      ...previous,
      complete: false,
      lastAttemptAt: now,
      refreshError:
        "ETF 일차 출처 카탈로그가 연결되지 않았습니다. 기존 기록을 유지하며 승인·신청 전수 범위는 미확인입니다.",
    };
  const hosts =
    options.allowedHosts ??
    (process.env.ETF_CATALOG_HOSTS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  let source: URL;
  try {
    source = new URL(url);
  } catch {
    return {
      ...previous,
      complete: false,
      lastAttemptAt: now,
      refreshError: "카탈로그 출처 주소가 올바르지 않습니다.",
    };
  }
  if (
    source.protocol !== "https:" ||
    source.username ||
    source.password ||
    (source.port && source.port !== "443") ||
    !hosts.includes(source.hostname)
  ) {
    return {
      ...previous,
      complete: false,
      lastAttemptAt: now,
      refreshError: "카탈로그 출처는 허용된 호스트의 HTTPS 주소여야 합니다.",
    };
  }
  try {
    const response = await (options.fetcher ?? fetch)(source, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const input = JSON.parse(await boundedText(response));
    const next = normalizeEtfCatalog(input);
    next.records = await verifyPrimaryRecords(next.records, hosts, options.fetcher ?? fetch, now);
    const catalog = mergeEtfCatalog(previous, next);
    const failedProof = next.records.some((r) => r.note.includes("이번 갱신에서 일차 원문"));
    return {
      ...catalog,
      records: reconcileFlowRecords(catalog.records),
      lastAttemptAt: now,
      refreshError: failedProof
        ? "일부 일차 원문을 확인하지 못해 해당 신규 상태를 미검증으로 보존했습니다."
        : null,
    };
  } catch (err) {
    // Do not stamp an old status as recently verified, delete absent filings, or silently empty the universe.
    return {
      ...previous,
      complete: false,
      lastAttemptAt: now,
      refreshError: err instanceof Error ? err.message.slice(0, 2000) : "카탈로그 수집 실패",
    };
  }
}
