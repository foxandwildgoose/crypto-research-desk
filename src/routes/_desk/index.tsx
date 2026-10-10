import { Link, useSearch } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { AssetLink, Money, Panel, Pct, Px, SaveButton, StatusText, useDesk, When, quoteOf, assetOf } from "@/components/desk-ui";
import { etfStrength, reviewHits, dedupeHits, type ReviewStatus } from "@/lib/desk/rules";
import { useWatch } from "@/lib/desk/watch-store";
import { fmtUsd } from "@/lib/desk/format";

export const Route = createFileRoute("/_desk/")({
  component: Home,
});

const RANK: Record<ReviewStatus, number> = { risk: 0, priority: 1, watch: 2, waiting: 3, gap: 4 };

function Home() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const rows = useWatch((s) => s.rows);
  const hits = dedupeHits(reviewHits(desk));
  const grouped = new Map<string, typeof hits>();
  for (const hit of hits) {
    const list = grouped.get(hit.assetId) ?? [];
    list.push(hit);
    grouped.set(hit.assetId, list);
  }
  const candidates = [...grouped.entries()]
    .map(([assetId, list]) => {
      const status = list.map((h) => h.status).sort((a, b) => RANK[a] - RANK[b])[0];
      return { assetId, status, why: list.map((h) => h.why).join(" "), recency: list[0]?.recency ?? desk.generatedAt };
    })
    .sort((a, b) => RANK[a.status] - RANK[b.status] || (a.recency < b.recency ? 1 : -1))
    .slice(0, 10);
  const savedOnly = rows.filter((r) => !grouped.has(r.assetId));
  const majors = ["btc", "eth", "sol"].map((id) => quoteOf(desk, id)).filter((q) => q);
  const flowAssets = [...new Set(desk.etf.sessions.map((s) => s.assetId))];
  const catalysts = [...desk.news.filter((n) => n.route === "disclosure"), ...desk.news.filter((n) => n.route === "news")].slice(0, 6);
  const memeMoves = desk.memes.filter((m) => m.mention || m.perpVenues.length).slice(0, 5);
  const warns = desk.warnings.filter((w) => w.level === "warn");

  return (
    <div className="space-y-3">
      <section className="flex max-w-full gap-2 overflow-x-auto">
        {majors.map((q) =>
          q ? (
            <Link key={q.assetId} to="/coins/$assetId" params={{ assetId: q.assetId }} search={search} className="min-w-44 rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-xs text-muted">{q.assetId.toUpperCase()} · {q.venue}</p>
              <p className="font-mono text-lg tabular-nums"><Px n={q.priceUsd} /></p>
              <p><Pct n={q.change24hPct} /> <span className="text-xs text-muted">24h</span></p>
              {q.fundingRate != null ? <p className="text-xs text-muted">펀딩 {(q.fundingRate * 100).toFixed(4)}%</p> : null}
              {q.premiumPct != null ? <p className="text-xs text-muted" title={q.premiumNote}>김프 참고 <Pct n={q.premiumPct} /></p> : null}
            </Link>
          ) : null,
        )}
      </section>
      {warns.length ? (
        <p className="rounded-md border border-warn px-3 py-2 text-sm text-warn">{warns.map((w) => w.message).join(" ")}</p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="검토 후보" aside="규칙이 걸린 자산만. 채우기용 후보는 없음.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 font-medium">코인</th>
                    <th className="font-medium">24h</th>
                    <th className="font-medium">7d</th>
                    <th className="font-medium">왜 지금</th>
                    <th className="font-medium">상태</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((row) => {
                    const asset = assetOf(desk, row.assetId);
                    const quote = quoteOf(desk, row.assetId);
                    return (
                      <tr key={row.assetId} className="border-t border-line align-top">
                        <td className="py-2 pr-2">{asset ? <AssetLink id={asset.id} search={search} symbol={asset.symbol} name={asset.nameKo} /> : row.assetId}</td>
                        <td className="pr-2"><Pct n={quote?.change24hPct} /></td>
                        <td className="pr-2"><Pct n={quote?.change7dPct} /></td>
                        <td className="max-w-sm pr-2 text-xs leading-5">{row.why}</td>
                        <td className="pr-2"><StatusText status={row.status} /></td>
                        <td><SaveButton assetId={row.assetId} /></td>
                      </tr>
                    );
                  })}
                  {!candidates.length ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-muted">오늘은 규칙에 걸린 후보가 없습니다. 저장된 관심은 아래에 따로 있습니다.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {savedOnly.length ? (
              <div className="mt-3 border-t border-line pt-2">
                <p className="mb-1 text-xs text-muted">저장만 된 자산. 새 규칙 없음.</p>
                <ul className="flex flex-wrap gap-2">
                  {savedOnly.map((row) => {
                    const asset = assetOf(desk, row.assetId);
                    return (
                      <li key={row.assetId}>
                        <Link to="/coins/$assetId" params={{ assetId: row.assetId }} search={search} className="rounded-md bg-chip px-2 py-1 text-sm">
                          {asset?.symbol ?? row.assetId}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </Panel>
        </div>
        <Panel title="새 자료" aside="공시와 헤드라인">
          <ul className="space-y-3">
            {catalysts.map((item) => (
              <li key={item.id} className="border-b border-line pb-2 last:border-0">
                <p className="text-sm">{item.summaryKo || item.title}</p>
                <p className="text-xs text-muted">{item.source} · {item.route === "disclosure" ? "공시" : "기사"} · <When iso={item.published ?? item.firstSeen} /></p>
                <Link to="/intel" search={search} className="text-xs text-accent">원문 맥락</Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="ETF 순유입 변화" aside="최근 5거래일 vs 이전 5거래일">
          <ul className="space-y-2 text-sm">
            {flowAssets.map((id) => {
              const sessions = desk.etf.sessions.filter((s) => s.assetId === id);
              const rule = etfStrength(sessions);
              const last = sessions[0];
              return (
                <li key={id} className="border-b border-line pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link to="/etf" search={{ ...search, q: id }} className="font-mono">{id.toUpperCase()}</Link>
                    <Money n={last?.netFlowUsd ?? null} />
                  </div>
                  <p className="text-xs leading-5 text-muted">{rule.why}</p>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="밈 주목" aside="급등 라벨은 기준선이 있을 때만">
          <ul className="space-y-2 text-sm">
            {memeMoves.map((m) => {
              const asset = assetOf(desk, m.assetId);
              const quote = quoteOf(desk, m.assetId);
              return (
                <li key={m.assetId} className="border-b border-line pb-2">
                  <div className="flex justify-between gap-2">
                    <AssetLink id={m.assetId} search={search} symbol={asset?.symbol ?? m.assetId} name={asset?.nameKo ?? ""} />
                    <Pct n={quote?.change24hPct} />
                  </div>
                  <p className="text-xs text-muted">{m.attentionNote} {m.perpVenues.join(", ") || "선물 없음"} · 거래량 {fmtUsd(m.volume24hUsd)}</p>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <footer className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>기준 {desk.generatedAt.slice(0, 16)}Z · 화면은 서울</span>
        {desk.modules.map((m) => (
          <span key={m.id}>{m.label} {m.state === "live" ? "실시간" : m.state === "snapshot" ? "스냅샷" : m.state === "partial" ? "부분" : "실패"}</span>
        ))}
        <span>{desk.warnings.find((w) => w.scope === "market")?.message}</span>
      </footer>
    </div>
  );
}
