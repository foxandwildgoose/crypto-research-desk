import raw from "../../data/desk-snapshot.json";
import { acquireDesk, fetchQuotes, socialFromFile } from "./collect.server.ts";
import type { DeskSnapshot } from "./types.ts";
import { catalogAssets, catalogWithFlows, refreshCatalog } from "./etf.server.ts";

let cache = raw as unknown as DeskSnapshot;
cache = { ...cache, etf: { ...cache.etf, catalog: catalogWithFlows(cache.etf, cache.assets) } };
cache.assets = catalogAssets(cache.etf.catalog!.records, cache.assets);

export async function loadEtfCatalog(): Promise<DeskSnapshot> {
  const catalog = await refreshCatalog(cache.etf.catalog!);
  cache = { ...cache, etf: { ...cache.etf, catalog }, assets: catalogAssets(catalog.records, cache.assets) };
  return cache;
}

export async function loadDesk(refresh: "no" | "market" | "research"): Promise<DeskSnapshot> {
  if (refresh === "research") {
    const next = await acquireDesk(undefined, cache.dat.holdings, cache.social, cache.etf);
    next.etf.catalog = catalogWithFlows({ ...next.etf, catalog: cache.etf.catalog }, next.assets);
    next.etf.catalog = await refreshCatalog(next.etf.catalog);
    next.assets = catalogAssets(next.etf.catalog.records, next.assets);
    next.mode = "mixed";
    cache = next;
    return cache;
  }
  if (refresh === "market") {
    const now = new Date().toISOString();
    try {
      const q = await fetchQuotes(cache.assets, now);
      const market = cache.modules.map((m) =>
        m.id === "market" ? { ...m, state: q.quotes.some((row) => row.priceUsd != null) ? ("live" as const) : ("failed" as const), checkedAt: now, detail: "OKX·업비트 시세 재조회" } : m,
      );
      cache = {
        ...cache,
        quotes: q.quotes.length ? q.quotes : cache.quotes,
        krwPerUsdt: q.krwPerUsdt ?? cache.krwPerUsdt,
        generatedAt: now,
        mode: "mixed",
        modules: market,
        warnings: [
          ...cache.warnings.filter((w) => w.scope !== "market-live"),
          ...q.warnings.map((message) => ({ level: "warn" as const, scope: "market-live", message })),
        ],
      };
    } catch (err) {
      cache = {
        ...cache,
        warnings: [
          ...cache.warnings,
          { level: "warn", scope: "market-live", message: err instanceof Error ? err.message : "시세 재조회 실패. 이전 스냅샷 유지." },
        ],
      };
    }
  }
  return cache;
}

function responseText(body: unknown): string {
  const output = (body as { output?: { type?: string; content?: { type?: string; text?: string }[] }[] }).output ?? [];
  const chunks: string[] = [];
  for (const item of output) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.text) chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

export async function loadSocial(): Promise<DeskSnapshot> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    cache = {
      ...cache,
      social: { ...cache.social, blockedReason: "XAI_API_KEY가 없어 X 검색을 실행하지 않습니다. 이미 있는 글은 그대로 둡니다." },
    };
    return cache;
  }
  const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  let res: Response;
  try {
    res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tool_calls: 4,
        max_turns: 2,
        input: [
          {
            role: "user",
            content: `Use only x_search. Return JSON only: {"posts":[{"handle":"","url":"","published":"YYYY-MM-DD or null","kind":"original|reply|repost|unknown","text":"","tokens":[],"contracts":[],"disclosure":null}]}. At most 5 posts from theunipcs and 3 from saylor. Do not invent urls, tickers, or contracts. Keep original text.`,
          },
        ],
        tools: [{ type: "x_search", allowed_x_handles: ["theunipcs", "saylor"], from_date: from, to_date: to }],
      }),
    });
  } catch (err) {
    cache = {
      ...cache,
      social: { ...cache.social, blockedReason: `X 검색 연결 실패. 기존 글 유지. ${err instanceof Error ? err.message : ""}` },
    };
    return cache;
  }
  if (!res.ok) {
    cache = {
      ...cache,
      social: { ...cache.social, blockedReason: `X 검색 HTTP ${res.status}. 뉴스·공시와 기존 글은 유지.` },
    };
    return cache;
  }
  const text = responseText(await res.json());
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) {
    cache = { ...cache, social: { ...cache.social, blockedReason: "X 응답에 게시물 JSON이 없음. 기존 글 유지." } };
    return cache;
  }
  try {
    const posts = socialFromFile(text.slice(start, end + 1), new Date().toISOString());
    if (!posts.length) {
      cache = { ...cache, social: { ...cache.social, blockedReason: "X 검색 0건. 없는 것을 삭제로 보지 않고 기존 글을 유지." } };
      return cache;
    }
    const now = new Date().toISOString();
    cache = {
      ...cache,
      social: {
        provenance: {
          source: "xAI X Search",
          url: "https://docs.x.ai/developers/tools/x-search",
          retrievedAt: now,
          asOf: posts[0]?.published ?? null,
          kind: "live",
          note: "버튼으로만 호출. @theunipcs @saylor. 투자 판단으로 해석하지 않음.",
        },
        posts,
        blockedReason: null,
      },
    };
  } catch {
    cache = { ...cache, social: { ...cache.social, blockedReason: "X JSON 파싱 실패. 기존 글 유지." } };
  }
  return cache;
}
