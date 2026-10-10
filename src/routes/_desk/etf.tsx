import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { FlowChart } from "@/components/charts";
import { Ext, Money, Panel, useDesk } from "@/components/desk-ui";
import { etfStrength, sessionWindow } from "@/lib/desk/rules";

export const Route = createFileRoute("/_desk/etf")({
  component: EtfPage,
});

function EtfPage() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const tab = search.tab === "products" || search.tab === "calendar" ? search.tab : "flows";
  const assets = [...new Set(desk.etf.products.map((p) => p.assetId))];
  const focus = assets.includes(search.q.toLowerCase()) ? search.q.toLowerCase() : assets[0];
  const sessions = desk.etf.sessions.filter((s) => s.assetId === focus);
  const products = desk.etf.products.filter((s) => !search.q || s.assetId.includes(search.q.toLowerCase()) || s.ticker.toLowerCase().includes(search.q.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["flows", "products", "calendar"] as const).map((id) => (
          <button key={id} type="button" className={`h-9 rounded-md px-3 text-sm ${tab === id ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: id }) })}>
            {id === "flows" ? "자금" : id === "products" ? "상품" : "일정"}
          </button>
        ))}
        <p className="self-center text-xs text-muted">{desk.etf.coverageNote}</p>
      </div>
      {tab === "flows" ? (
        <>
          <div className="flex gap-2">
            {assets.map((id) => (
              <button key={id} type="button" className={`h-9 rounded-md px-3 font-mono text-sm ${focus === id ? "bg-chip" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, q: id }) })}>
                {id.toUpperCase()}
              </button>
            ))}
          </div>
          <Panel title={`${focus?.toUpperCase() ?? ""} 순유입`} aside={desk.etf.provenance.note}>
            <FlowChart rows={[...sessions].reverse().filter((s) => s.netFlowUsd != null).map((s) => ({ day: s.date, flow: s.netFlowUsd ?? 0 }))} />
            <p className="text-sm">{sessions.length ? etfStrength(sessions).why : "세션 없음"}</p>
            <p className="text-xs text-muted">5세션 {labelSum(sessionWindow(sessions, 0, 5).sum)} · 20세션 {labelSum(sessionWindow(sessions, 0, 20).sum)} · 휴장일은 행이 없어 0이 아님</p>
          </Panel>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs text-muted"><tr><th className="px-2 py-1">날짜</th><th>순유입</th><th>거래대금</th><th>순자산</th><th>누적</th><th>+/−/0</th><th>결측</th></tr></thead>
              <tbody>
                {sessions.slice(0, 24).map((s) => (
                  <tr key={s.date} className="border-t border-line">
                    <td className="px-2 py-1 font-mono">{s.date}</td>
                    <td><Money n={s.netFlowUsd} /></td>
                    <td><Money n={s.valueTradedUsd} /></td>
                    <td><Money n={s.netAssetsUsd} /></td>
                    <td><Money n={s.cumFlowUsd} /></td>
                    <td className="font-mono text-xs">{s.positiveIssuers ?? "—"}/{s.negativeIssuers ?? "—"}/{s.flatIssuers ?? "—"}</td>
                    <td className="text-xs">{s.partial ? s.missingTickers.join(", ") || "부분" : "보고분 완전"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Heat deskAsset={focus} />
          <details className="text-sm">
            <summary className="cursor-pointer">펀드별 최근 세션</summary>
            <ul className="mt-2 space-y-1">
              {desk.etf.products.filter((p) => p.assetId === focus).map((p) => (
                <li key={p.ticker} className="flex justify-between gap-3 border-b border-line py-1">
                  <span className="font-mono">{p.ticker}</span><span>{p.issuer}</span><Money n={p.dailyFlowUsd} applicable={p.dailyFlowUsd != null} />
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}
      {tab === "products" ? (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-muted"><tr><th className="px-2 py-1">자산</th><th>티커</th><th>발행사</th><th>지역</th><th>유형</th><th>상태</th><th>AUM</th><th>출처</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.assetId + p.ticker} className="border-t border-line">
                  <td className="px-2 py-1 font-mono">{p.assetId.toUpperCase()}</td>
                  <td className="font-mono">{p.ticker}</td>
                  <td>{p.issuer}</td>
                  <td>{p.jurisdiction}</td>
                  <td>{p.exposure === "spot" ? "현물" : "미분류"}</td>
                  <td>{p.tradingState === "reported" ? "숫자 있음" : "행만 있음"}</td>
                  <td><Money n={p.aumUsd} /></td>
                  <td><Ext href={p.sourceUrl}>페이지</Ext></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab === "calendar" ? (
        <ul className="space-y-3">
          {desk.etf.milestones.map((m) => (
            <li key={m.id} className="rounded-md border border-line bg-surface p-3 text-sm">
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-muted">{m.date ?? "날짜 미확인"} · {m.uncertainty}</p>
              <p>{m.summary}</p>
              <Ext href={m.url}>근거</Ext>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Heat({ deskAsset }: { deskAsset: string | undefined }) {
  const desk = useDesk();
  if (!deskAsset) return null;
  const cells = desk.etf.heat.filter((h) => h.assetId === deskAsset);
  const dates = [...new Set(cells.map((c) => c.date))].sort();
  const tickers = [...new Set(cells.map((c) => c.ticker))];
  return (
    <Panel title="코인×세션" aside="단위 백만 달러. 빈 칸은 결측.">
      <div className="overflow-x-auto">
        <table className="text-left text-xs">
          <thead>
            <tr>
              <th className="px-1 py-1">티커</th>
              {dates.slice(-12).map((d) => <th key={d} className="px-1 font-mono">{d.slice(5)}</th>)}
            </tr>
          </thead>
          <tbody>
            {tickers.map((t) => (
              <tr key={t}>
                <td className="py-1 pr-2 font-mono">{t}</td>
                {dates.slice(-12).map((d) => {
                  const cell = cells.find((c) => c.ticker === t && c.date === d);
                  const v = cell?.flowUsd;
                  const m = v == null ? null : v / 1e6;
                  return (
                    <td key={d} className={`px-1 font-mono tabular-nums ${m == null ? "text-muted" : m > 0 ? "text-up" : m < 0 ? "text-down" : ""}`}>
                      {m == null ? "—" : m.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function labelSum(n: number | null) {
  if (n == null) return "합산 안 함";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
