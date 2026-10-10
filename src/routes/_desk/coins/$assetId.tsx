import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { FlowChart, PriceChart, StepChart } from "@/components/charts";
import { Ext, Money, Panel, Pct, Px, Qty, SaveButton, useDesk, When } from "@/components/desk-ui";
import { etfStrength, priceReaction, sessionWindow } from "@/lib/desk/rules";
import { useWatch } from "@/lib/desk/watch-store";
import { fmtPct, seoulDate } from "@/lib/desk/format";

export const Route = createFileRoute("/_desk/coins/$assetId")({
  component: CoinPage,
});

const TABS = ["etf", "dat", "market", "meme", "news", "notes"] as const;

function CoinPage() {
  const { assetId } = Route.useParams();
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const asset = desk.assets.find((a) => a.id === assetId);
  const quote = desk.quotes.find((q) => q.assetId === assetId);
  const tab = TABS.includes(search.tab as (typeof TABS)[number]) ? (search.tab as (typeof TABS)[number]) : "etf";
  const sessions = desk.etf.sessions.filter((s) => s.assetId === assetId);
  const products = desk.etf.products.filter((p) => p.assetId === assetId);
  const holdings = desk.dat.holdings.filter((h) => h.assetId === assetId);
  const discs = desk.dat.disclosures.filter((d) => d.assetId === assetId);
  const news = desk.news.filter((n) => n.assetIds.includes(assetId) || n.title.toUpperCase().includes(asset?.symbol ?? "___"));
  const meme = desk.memes.find((m) => m.assetId === assetId);
  const posts = desk.social.posts.filter((p) => p.tokens.some((t) => t.replace(/^\$/, "").toUpperCase() === asset?.symbol));
  const candles = (desk.candles[assetId] ?? []).slice(-(search.w === "7" ? 8 : search.w === "90" ? 40 : 31));
  const etf = products.length ? etfStrength(sessions) : null;
  const five = sessionWindow(sessions, 0, 5);
  const latestDisc = discs.find((d) => d.classification === "purchase") ?? discs[0];
  const reaction = latestDisc ? priceReaction(desk.candles[assetId] ?? [], latestDisc.asOf) : null;
  const btc = assetId === "btc" ? null : relToBtc(candles, desk.candles.btc ?? []);
  const horizon = search.h === "s" ? "전략 구간에서는 5세션보다 누적 순유입과 공급 비중을 먼저 봅니다." : "전술 구간에서는 최근 5거래일 순유입과 공시 매수를 먼저 봅니다.";
  const row = useWatch((s) => s.rows.find((r) => r.assetId === assetId));
  const patch = useWatch((s) => s.patch);
  const addCondition = useWatch((s) => s.addCondition);
  const [field, setField] = useState<"priceUsd" | "change24hPct" | "etf5" | "funding">("change24hPct");
  const [cmp, setCmp] = useState<"gt" | "lt">("gt");
  const [value, setValue] = useState("0");

  if (!asset) return <p className="text-sm">이 심볼은 현재 수집 목록에 없습니다.</p>;

  const balances = discs.filter((d) => d.endingQty != null).sort((a, b) => (a.asOf < b.asOf ? -1 : 1));

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{asset.themes.join(" · ") || "미분류"} · {asset.identity === "verified" ? "컨트랙트 대조" : asset.identity === "native" ? "네이티브" : "정체 미확정"}</p>
          <h1 className="text-2xl font-semibold">{asset.nameKo} <span className="font-mono">{asset.symbol}</span></h1>
          <p className="text-sm text-muted">{quote?.venue ?? "시세 없음"} · <When iso={quote?.asOf} /></p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl tabular-nums"><Px n={quote?.priceUsd ?? null} /></p>
          <p><Pct n={quote?.change24hPct} /> <span className="text-xs text-muted">24h</span> <Pct n={quote?.change7dPct} /> <span className="text-xs text-muted">7d</span></p>
        </div>
      </header>
      <div className="flex flex-wrap gap-2">
        <SaveButton assetId={assetId} />
        <button type="button" className="h-9 rounded-md border border-line px-3 text-sm" onClick={() => void navigate({ to: "/coins", search: { ...search, cmp: [search.cmp, assetId].filter(Boolean).join(",") } })}>
          비교에 넣기
        </button>
        {quote?.sourceUrl ? <a className="inline-flex h-9 items-center text-sm text-accent" href={quote.sourceUrl} target="_blank" rel="noreferrer">시세 출처</a> : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <Panel title="가격" aside="OKX 일봉. ETF와 축을 섞지 않음.">
            {candles.length ? <PriceChart candles={candles} /> : <p className="text-sm text-muted">일봉이 없습니다.</p>}
            {btc != null ? <p className="mt-2 text-xs text-muted">같은 일봉 수 기준 BTC 대비 {fmtPct(btc)}. 상관의 증거가 아닙니다.</p> : null}
          </Panel>
          {products.length ? (
            <Panel title="ETF 일별 순유입" aside={sessions[0] ? `최근 세션 ${sessions[0].date}` : ""}>
              <FlowChart rows={[...sessions].reverse().filter((s) => s.netFlowUsd != null).slice(-(search.w === "7" ? 7 : 30)).map((s) => ({ day: s.date, flow: s.netFlowUsd as number }))} />
              <p className="text-xs text-muted">결측 세션은 차트에서 0으로 보이지 않게 빼고, 합계 규칙에서도 제외합니다. 여기 슬라이스는 값이 있는 세션만입니다.</p>
            </Panel>
          ) : null}
        </div>
        <Panel title="짧은 논지" aside={search.h === "s" ? "전략" : "전술"}>
          <ul className="space-y-2 text-sm leading-6">
            <li><b>관찰</b> {etf ? etf.why : "이 자산의 ETF 순유입 표는 없음."} {latestDisc ? latestDisc.excerpt : ""}</li>
            <li><b>수요로 이어질 수 있는 경로</b> ETF 순창출은 즉시 비헤지 현물 매수를 증명하지 않습니다. 기업 매수는 공시 기간의 집행이지 매일의 체결이 아닙니다.</li>
            <li><b>다른 설명</b> 가격은 펀딩, 선물 포지션, 거시 금리, 이 표에 없는 채굴 매도로도 움직입니다.</li>
            <li><b>가격 반응</b> {reaction ? `${reaction.note} 이후 ${fmtPct(reaction.since)}, 이전 ${fmtPct(reaction.pre)}.` : "연결할 공시 시각이 없습니다."}</li>
            <li><b>다음 확인</b> {horizon}</li>
            <li><b>무효화</b> {row?.invalidation || "관심 메모의 무효 조건이 비어 있습니다. 알림 조건과는 별개입니다."}</li>
          </ul>
          {quote?.contractMultiplier != null && quote.perpAvailable ? (
            <p className="mt-2 text-xs text-muted">USDT-M 계약면 {quote.contractMultiplier} {asset.symbol}. 현물 가격을 이 숫자로 나누지 않습니다.</p>
          ) : null}
        </Panel>
      </div>
      <div className="flex flex-wrap gap-1">
        {TABS.map((id) => (
          <button key={id} type="button" className={`h-9 rounded-md px-3 text-sm ${tab === id ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: id }) })}>
            {{ etf: "ETF", dat: "기업", market: "시장", meme: "밈", news: "뉴스", notes: "메모" }[id]}
          </button>
        ))}
      </div>
      {tab === "etf" ? (
        <Panel title="ETF" aside={products.length ? "해당 있음" : "N/A"}>
          {!products.length ? <p className="text-sm text-muted">이 자산의 미국 현물 ETF 행이 출처 페이지에 없습니다. 0 유입으로 두지 않습니다.</p> : null}
          {products.length ? <p className="mb-2 text-xs text-muted">5세션 {five.sum == null ? "결측으로 합산 안 함" : fmtUsdSafe(five.sum)}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted"><tr><th>티커</th><th>발행사</th><th>일일 순유입</th><th>AUM</th><th>누적</th><th>수수료</th><th /></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.ticker} className="border-t border-line">
                    <td className="py-1 font-mono">{p.ticker}</td>
                    <td>{p.issuer}</td>
                    <td><Money n={p.dailyFlowUsd} applicable={p.tradingState === "reported" || p.dailyFlowUsd != null} /></td>
                    <td><Money n={p.aumUsd} /></td>
                    <td><Money n={p.cumulativeFlowUsd} /></td>
                    <td className="font-mono">{p.feePct == null ? "—" : `${p.feePct}%`}</td>
                    <td><Ext href={p.sourceUrl}>출처</Ext></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
      {tab === "dat" ? (
        <Panel title="기업 보유" aside="디렉터리와 SEC를 합치지 않음">
          {!holdings.length && !discs.length ? <p className="text-sm text-muted">N/A. 트레저리 디렉터리와 SEC 파싱 모두 이 자산 행이 없습니다.</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs text-muted"><tr><th>회사</th><th>분류</th><th>수량</th><th>공급 비중</th><th>출처</th></tr></thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.companyId + h.ticker} className="border-t border-line">
                    <td className="py-1"><Link to="/dat/$companyId" params={{ companyId: h.companyId }} search={search} className="hover:text-accent">{h.name}</Link></td>
                    <td>{h.kind}</td>
                    <td><Qty n={h.holdings} /></td>
                    <td className="font-mono">{h.supplySharePct == null ? "—" : `${h.supplySharePct.toFixed(3)}%`}</td>
                    <td className="text-xs">CoinGecko. 일자 없음</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {balances.length > 1 ? <StepChart rows={balances.map((d) => ({ day: d.asOf.slice(0, 10), qty: d.endingQty ?? 0 }))} /> : null}
          <ul className="mt-2 space-y-2 text-sm">
            {discs.map((d) => (
              <li key={d.id}><Ext href={d.sourceUrl}>{seoulDate(d.asOf.slice(0, 10))}</Ext> {d.excerpt}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {tab === "market" ? (
        <Panel title="시장" aside={quote?.premiumNote}>
          <ul className="space-y-1 text-sm">
            <li>거래대금(24h) <Money n={quote?.volume24hUsd ?? null} /></li>
            <li>시가총액 <Money n={quote?.marketCapUsd ?? null} applicable={quote?.marketCapUsd != null} /></li>
            <li>업비트 KRW {quote?.upbitKrw ? <Qty n={quote.krwPrice} /> : "상장 목록에 없음"}</li>
            <li>참고 프리미엄 <Pct n={quote?.premiumPct} />. 동시호가 아님.</li>
            <li>펀딩 {quote?.fundingRate == null ? "—" : `${(quote.fundingRate * 100).toFixed(4)}%`} {quote?.fundingTime ? <When iso={quote.fundingTime} /> : null}</li>
            <li>미결제약정 <Money n={quote?.openInterestUsd ?? null} applicable={quote?.openInterestUsd != null} /></li>
            <li>선물 {quote?.perpAvailable ? "OKX USDT-M 있음. 거래 권유 아님." : "확인된 USDT-M 없음"}</li>
            {asset.contract ? <li>컨트랙트 {asset.contract.chain} <span className="font-mono text-xs">{asset.contract.address}</span>. {asset.contract.note}</li> : null}
          </ul>
        </Panel>
      ) : null}
      {tab === "meme" ? (
        <Panel title="밈·소셜">
          {meme ? <p className="text-sm leading-6">{meme.reason} {meme.risk} {meme.attentionNote} 정체: {meme.identityNote}</p> : <p className="text-sm text-muted">밈 후보 풀에 없는 자산입니다.</p>}
          <ul className="mt-2 space-y-2 text-sm">
            {posts.map((p) => (
              <li key={p.id}><Ext href={p.url}>@{p.handle}</Ext> {p.summaryKo}<p className="text-xs">{p.text}</p></li>
            ))}
            {!posts.length ? <li className="text-muted">이 심볼을 가리키는 저장 게시물이 없습니다.</li> : null}
          </ul>
        </Panel>
      ) : null}
      {tab === "news" ? (
        <Panel title="뉴스·촉매">
          <ul className="space-y-2 text-sm">
            {news.map((n) => (
              <li key={n.id}><Ext href={n.url}>{n.title}</Ext><p className="text-xs text-muted">{n.summaryKo} {n.counter}</p></li>
            ))}
            {!news.length ? <li className="text-muted">연결 헤드라인 없음. 자료 없음이지 사건 없음이 아닙니다.</li> : null}
          </ul>
        </Panel>
      ) : null}
      {tab === "notes" ? (
        <Panel title="메모와 조건" aside="이 브라우저에만 저장">
          {!row ? <p className="mb-2 text-sm text-muted">관심을 저장하면 메모와 조건을 남길 수 있습니다.</p> : null}
          <label className="block text-sm">무효화 메모 (알림 조건 아님)
            <textarea className="mt-1 w-full rounded-md border border-line bg-bg p-2" rows={3} value={row?.invalidation ?? ""} onChange={(e) => row && patch(assetId, { invalidation: e.target.value.slice(0, 2000) })} />
          </label>
          <label className="mt-2 block text-sm">연구 노트
            <textarea className="mt-1 w-full rounded-md border border-line bg-bg p-2" rows={3} value={row?.note ?? ""} onChange={(e) => row && patch(assetId, { note: e.target.value.slice(0, 2000) })} />
          </label>
          <form className="mt-3 flex flex-wrap items-end gap-2 text-sm" onSubmit={(e) => {
            e.preventDefault();
            const n = Number(value);
            if (!Number.isFinite(n)) return;
            addCondition(assetId, { id: `${field}-${cmp}-${n}`, assetId, field, cmp, value: n, note: "화면이 열려 있을 때만 평가" });
          }}>
            <select className="h-9 rounded-md border border-line bg-surface px-2" value={field} onChange={(e) => setField(e.target.value as typeof field)}>
              <option value="change24hPct">24h %</option>
              <option value="priceUsd">가격 USD</option>
              <option value="etf5">ETF 5세션 USD</option>
              <option value="funding">펀딩</option>
            </select>
            <select className="h-9 rounded-md border border-line bg-surface px-2" value={cmp} onChange={(e) => setCmp(e.target.value === "lt" ? "lt" : "gt")}>
              <option value="gt">초과</option>
              <option value="lt">미만</option>
            </select>
            <input className="h-9 w-28 rounded-md border border-line bg-bg px-2" value={value} onChange={(e) => setValue(e.target.value)} />
            <button className="h-9 rounded-md bg-accent px-3 text-accent-fg" type="submit">조건 만들기</button>
          </form>
          <ul className="mt-2 text-sm">
            {(row?.conditions ?? []).map((c) => <li key={c.id} className="font-mono text-xs">{c.field} {c.cmp} {c.value}</li>)}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function relToBtc(asset: { t: number; c: number }[], btc: { t: number; c: number }[]) {
  if (asset.length < 2 || btc.length < 2) return null;
  const a0 = asset[0];
  const a1 = asset[asset.length - 1];
  const b0 = btc.find((c) => Math.abs(c.t - a0.t) < 36e5) ?? btc[0];
  const b1 = btc[btc.length - 1];
  if (!a0.c || !b0.c) return null;
  const ar = a1.c / a0.c - 1;
  const br = b1.c / b0.c - 1;
  return (ar - br) * 100;
}

function fmtUsdSafe(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
