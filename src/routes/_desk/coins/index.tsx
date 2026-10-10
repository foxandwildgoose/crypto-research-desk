import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { AssetLink, Money, Panel, Pct, SaveButton, useDesk, quoteOf } from "@/components/desk-ui";
import { sessionWindow } from "@/lib/desk/rules";
import { assetEtfRecords, etfSection } from "@/lib/desk/etf";
import { useWatch } from "@/lib/desk/watch-store";
import type { DeskSnapshot } from "@/lib/desk/types";
import type { DeskSearch } from "@/lib/desk/search";

export const Route = createFileRoute("/_desk/coins/")({
  component: Coins,
});

function passes(desk: DeskSnapshot, search: DeskSearch, id: string, saved: boolean) {
  const asset = desk.assets.find((a) => a.id === id);
  if (!asset) return false;
  if (search.q) {
    const blob = `${asset.symbol} ${asset.name} ${asset.nameKo}`.toLowerCase();
    if (!blob.includes(search.q.toLowerCase())) return false;
  }
  if (search.theme && !asset.themes.includes(search.theme)) return false;
  if (search.watch === "1" && !saved) return false;
  const etf = desk.etf.products.some((p) => p.assetId === id) || assetEtfRecords(desk.etf.catalog?.records ?? [], id).length > 0;
  if (search.etf === "yes" && !etf) return false;
  if (search.etf === "no" && etf) return false;
  const dat = desk.dat.holdings.some((h) => h.assetId === id && h.kind === "treasury");
  if (search.dat === "yes" && !dat) return false;
  if (search.dat === "no" && dat) return false;
  const quote = quoteOf(desk, id);
  if (search.venue === "upbit" && !quote?.upbitKrw) return false;
  if (search.venue === "perp" && !quote?.perpAvailable) return false;
  return true;
}

function Coins() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const saved = useWatch((s) => s.rows);
  const [sort, setSort] = useState<"sym" | "d1" | "flow">("sym");
  const ids = desk.assets.map((a) => a.id).filter((id) => passes(desk, search, id, saved.some((r) => r.assetId === id)));
  const cmp = search.cmp.split(",").filter(Boolean).slice(0, 4);
  const rows = ids
    .map((id) => {
      const quote = quoteOf(desk, id);
      const sessions = desk.etf.sessions.filter((s) => s.assetId === id);
      const flow = sessionWindow(sessions, 0, 5);
      const hasFlows = desk.etf.products.some((p) => p.assetId === id);
      const etfRecords = assetEtfRecords(desk.etf.catalog?.records ?? [], id);
      const approved = etfRecords.filter((record) => etfSection(record) === "approved").length;
      const applications = etfRecords.filter((record) => etfSection(record) === "applications").length;
      const unverified = etfRecords.some((record) => etfSection(record) === "unverified");
      const dat = desk.dat.holdings.filter((h) => h.assetId === id && h.kind === "treasury");
      return {
        id, quote, flow: hasFlows ? flow.sum : null, etfApplicable: hasFlows,
        etfLabel: approved || applications ? `승인 ${approved} · 신청 ${applications}` : unverified ? "미검증 기록" : etfRecords.length ? "과거 기록" : hasFlows ? "자금 행만 있음" : "수집 기록 없음",
        datApplicable: dat.length > 0, datQty: dat.reduce((a, h) => a + h.holdings, 0),
      };
    })
    .sort((a, b) => {
      if (sort === "d1") return (b.quote?.change24hPct ?? -999) - (a.quote?.change24hPct ?? -999);
      if (sort === "flow") return (b.flow ?? -1e18) - (a.flow ?? -1e18);
      return a.id.localeCompare(b.id);
    });

  function toggleCmp(id: string) {
    const next = cmp.includes(id) ? cmp.filter((x) => x !== id) : [...cmp, id].slice(0, 4);
    void navigate({ to: ".", search: (prev) => ({ ...prev, cmp: next.join(",") }) });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <select className="h-9 rounded-md border border-line bg-surface px-2" value={search.theme} onChange={(e) => void navigate({ to: ".", search: (p) => ({ ...p, theme: e.target.value }) })}>
          <option value="">테마 전체</option>
          <option value="메이저">메이저</option>
          <option value="밈">밈</option>
          <option value="인프라">인프라</option>
          <option value="ETF">ETF만 있는 심볼</option>
        </select>
        <select className="h-9 rounded-md border border-line bg-surface px-2" value={search.etf} onChange={(e) => void navigate({ to: ".", search: (p) => ({ ...p, etf: e.target.value === "yes" || e.target.value === "no" ? e.target.value : "all" }) })}>
          <option value="all">ETF 전체</option>
          <option value="yes">ETF 기록 있음</option>
          <option value="no">ETF 기록 없음</option>
        </select>
        <select className="h-9 rounded-md border border-line bg-surface px-2" value={search.dat} onChange={(e) => void navigate({ to: ".", search: (p) => ({ ...p, dat: e.target.value === "yes" || e.target.value === "no" ? e.target.value : "all" }) })}>
          <option value="all">기업보유 전체</option>
          <option value="yes">트레저리 보유</option>
          <option value="no">트레저리 없음</option>
        </select>
        <select className="h-9 rounded-md border border-line bg-surface px-2" value={search.venue} onChange={(e) => void navigate({ to: ".", search: (p) => ({ ...p, venue: e.target.value }) })}>
          <option value="">거래소 전체</option>
          <option value="upbit">업비트 KRW</option>
          <option value="perp">USDT-M 선물</option>
        </select>
        <button type="button" className="h-9 rounded-md border border-line px-3" onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, watch: p.watch === "1" ? "0" : "1" }) })}>
          {search.watch === "1" ? "관심만 보는 중" : "관심만"}
        </button>
        <select className="h-9 rounded-md border border-line bg-surface px-2" value={sort} onChange={(e) => setSort(e.target.value === "d1" || e.target.value === "flow" ? e.target.value : "sym")}>
          <option value="sym">심볼</option>
          <option value="d1">24h</option>
          <option value="flow">ETF 5세션</option>
        </select>
      </div>
      <Panel title="코인" aside={`${rows.length}개 · ETF/기업 공백은 N/A`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 font-medium">비교</th>
                <th className="font-medium">코인</th>
                <th className="font-medium">가격</th>
                <th className="font-medium">24h</th>
                <th className="font-medium">7d</th>
                <th className="font-medium">ETF 기록</th>
                <th className="font-medium">ETF 5세션</th>
                <th className="font-medium">트레저리 합성</th>
                <th className="font-medium">장소</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const asset = desk.assets.find((a) => a.id === row.id)!;
                return (
                  <tr key={row.id} className="border-t border-line">
                    <td className="py-2">
                      <button type="button" className="h-9 rounded-md border border-line px-2 text-xs" onClick={() => toggleCmp(row.id)}>
                        {cmp.includes(row.id) ? "빼기" : "비교"}
                      </button>
                    </td>
                    <td><AssetLink id={row.id} search={search} symbol={asset.symbol} name={asset.nameKo} /></td>
                    <td className="font-mono tabular-nums">{row.quote?.priceUsd == null ? "—" : row.quote.priceUsd.toLocaleString("en-US", { maximumFractionDigits: row.quote.priceUsd < 1 ? 8 : 2 })}</td>
                    <td><Pct n={row.quote?.change24hPct} /></td>
                    <td><Pct n={row.quote?.change7dPct} /></td>
                    <td className="text-xs text-muted">{row.etfLabel}</td>
                    <td><Money n={row.flow} applicable={row.etfApplicable} /></td>
                    <td>{row.datApplicable ? <span className="font-mono text-sm tabular-nums">{row.datQty.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span> : <span className="text-muted">N/A</span>}</td>
                    <td className="text-xs text-muted">{row.quote?.venue ?? "—"}{row.quote?.upbitKrw ? " · KRW" : ""}</td>
                    <td><SaveButton assetId={row.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">트레저리 합은 회사별 최신 공개의 합성입니다. 같은 시각 잔고가 아닙니다. ETF 기록은 단일 자산 상품·신청만 반영하며, 미검증 기록을 승인으로 세지 않습니다. ETF 기록의 유무는 자금 수치의 제공 여부와 별개입니다. ETF 5세션은 결측이 있으면 — 입니다.</p>
      </Panel>
      {cmp.length > 1 ? (
        <Panel title="비교" aside="같은 단위, 최대 4개">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 font-medium">항목</th>
                  {cmp.map((id) => <th key={id} className="font-mono">{id.toUpperCase()}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <td className="py-2">24h</td>
                  {cmp.map((id) => <td key={id}><Pct n={quoteOf(desk, id)?.change24hPct} /></td>)}
                </tr>
                <tr className="border-t border-line">
                  <td className="py-2">7d</td>
                  {cmp.map((id) => <td key={id}><Pct n={quoteOf(desk, id)?.change7dPct} /></td>)}
                </tr>
                <tr className="border-t border-line">
                  <td className="py-2">ETF 최근 세션</td>
                  {cmp.map((id) => {
                    const applicable = desk.etf.products.some((p) => p.assetId === id);
                    const last = desk.etf.sessions.find((s) => s.assetId === id);
                    return <td key={id}><Money n={last?.netFlowUsd ?? null} applicable={applicable} /></td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
