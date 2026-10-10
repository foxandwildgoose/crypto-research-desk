import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { StepChart } from "@/components/charts";
import { Ext, Money, Panel, Qty, useDesk } from "@/components/desk-ui";

export const Route = createFileRoute("/_desk/dat/$companyId")({
  component: CompanyPage,
});

function CompanyPage() {
  const { companyId } = Route.useParams();
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const holdings = desk.dat.holdings.filter((h) => h.companyId === companyId);
  const discs = desk.dat.disclosures.filter((d) => d.companyId === companyId);
  const recs = desk.dat.reconciliations.filter((r) => r.companyId === companyId);
  const name = holdings[0]?.name ?? discs[0]?.companyId ?? companyId;
  if (!holdings.length && !discs.length) return <p className="text-sm">이 회사 행이 없습니다.</p>;
  const steps = discs.filter((d) => d.endingQty != null && d.assetId === (discs.find((x) => x.endingQty)?.assetId ?? "")).sort((a, b) => (a.asOf < b.asOf ? -1 : 1));

  return (
    <div className="space-y-3">
      <header>
        <p className="text-xs text-muted">{holdings[0]?.ticker} · {holdings[0]?.country}</p>
        <h1 className="text-2xl font-semibold">{name}</h1>
      </header>
      <Panel title="보유" aside="자산마다 한 행">
        <ul className="space-y-2 text-sm">
          {holdings.map((h) => (
            <li key={h.assetId} className="flex flex-wrap justify-between gap-2 border-b border-line py-1">
              <Link to="/coins/$assetId" params={{ assetId: h.assetId }} search={search} className="font-mono">{h.assetId.toUpperCase()}</Link>
              <Qty n={h.holdings} />
              <Money n={h.currentValueUsd} />
              <span className="text-xs text-muted">디렉터리 취득원가 {h.entryValueUsd == null ? "미기재(0을 원가로 보지 않음)" : ""}</span>
              {h.entryValueUsd != null ? <Money n={h.entryValueUsd} /> : null}
            </li>
          ))}
        </ul>
      </Panel>
      {steps.length > 1 ? (
        <Panel title="공시 잔고" aside="SEC 파싱. 디렉터리와 다른 축">
          <StepChart rows={steps.map((d) => ({ day: d.asOf.slice(0, 10), qty: d.endingQty ?? 0 }))} />
        </Panel>
      ) : null}
      <Panel title="매수·잔고·재원">
        <ul className="space-y-3 text-sm">
          {discs.map((d) => (
            <li key={d.id} className="border-b border-line pb-2">
              <p>{d.classification === "purchase" ? "매수" : "잔고"} · {d.assetId.toUpperCase()} · {d.asOf.slice(0, 10)}</p>
              <p>{d.excerpt}</p>
              {d.stakingQty != null ? <p className="text-xs text-muted">스테이킹 {d.stakingQty.toLocaleString("en-US")}는 보유에 더하지 않음.</p> : null}
              {d.proceedsFromEquityUsd != null ? <p className="text-xs">주식 순수입으로 매수 <Money n={d.proceedsFromEquityUsd} /> · 현금 <Money n={d.cashUsedUsd} />. 발행 한도가 아니라 이번 매수 재원.</p> : null}
              {d.cashAndSecuritiesUsd != null ? <p className="text-xs">현금·유가증권 <Money n={d.cashAndSecuritiesUsd} /></p> : null}
              <Ext href={d.sourceUrl}>원문</Ext>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="대사">
        {recs.length ? recs.map((r) => (
          <p key={r.assetId} className="text-sm">{r.assetId.toUpperCase()} {r.beginAsOf.slice(0, 10)} {r.beginQty.toLocaleString("en-US")} → {r.endAsOf.slice(0, 10)} {r.endQty.toLocaleString("en-US")}. 매수 {r.buys.toLocaleString("en-US")}, 매도 {r.sales.toLocaleString("en-US")}, 보상 {r.rewards.toLocaleString("en-US")}. {r.note}</p>
        )) : <p className="text-sm text-muted">비교 가능한 두 잔고가 없습니다.</p>}
      </Panel>
    </div>
  );
}
