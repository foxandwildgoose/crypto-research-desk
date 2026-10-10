import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Money, Panel, Qty, useDesk } from "@/components/desk-ui";
import type { CompanyKind } from "@/lib/desk/types";

export const Route = createFileRoute("/_desk/dat/")({
  component: DatPage,
});

const KIND: Record<CompanyKind, string> = {
  treasury: "트레저리",
  miner: "채굴",
  operating: "운영",
  exchange: "거래소",
  other: "기타",
};

function DatPage() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const tab = search.tab === "company" ? "company" : "coin";
  const kind = (search.kind || "treasury") as CompanyKind | "all";
  const rows = desk.dat.holdings.filter((h) => {
    if (kind !== "all" && h.kind !== kind) return false;
    if (!search.q) return true;
    const q = search.q.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.ticker.toLowerCase().includes(q) || h.assetId.includes(q);
  });
  const coins = [...new Set(rows.map((h) => h.assetId))];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`h-9 rounded-md px-3 text-sm ${tab === "coin" ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: "coin" }) })}>코인</button>
        <button type="button" className={`h-9 rounded-md px-3 text-sm ${tab === "company" ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: "company" }) })}>회사</button>
        <select className="h-9 rounded-md border border-line bg-surface px-2 text-sm" value={kind} onChange={(e) => void navigate({ to: ".", search: (p) => ({ ...p, kind: e.target.value }) })}>
          <option value="treasury">트레저리만</option>
          <option value="miner">채굴</option>
          <option value="operating">운영</option>
          <option value="exchange">거래소</option>
          <option value="other">기타</option>
          <option value="all">전체</option>
        </select>
      </div>
      <p className="text-xs text-muted">{desk.dat.coverageNote} {desk.dat.provenance.note}</p>
      {tab === "coin" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {coins.map((id) => {
            const list = rows.filter((h) => h.assetId === id);
            const sum = list.reduce((a, h) => a + h.holdings, 0);
            return (
              <Panel key={id} title={id.toUpperCase()} aside={`합성 ${list.length}사. 일자 불일치`}>
                <p className="mb-2 font-mono text-sm tabular-nums">합 {sum.toLocaleString("en-US", { maximumFractionDigits: 2 })} · 동기 잔고 아님</p>
                <ul>
                  {list.slice(0, 8).map((h) => (
                    <li key={h.companyId} className="flex justify-between gap-2 border-t border-line py-1 text-sm">
                      <Link to="/dat/$companyId" params={{ companyId: h.companyId }} search={search} className="hover:text-accent">{h.name}</Link>
                      <Qty n={h.holdings} />
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-2 py-1">회사</th><th>코인</th><th>수량</th><th>평가</th><th>공급%</th><th>분류</th><th>출처</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 80).map((h) => (
                <tr key={h.companyId + h.assetId} className="border-t border-line">
                  <td className="px-2 py-1"><Link to="/dat/$companyId" params={{ companyId: h.companyId }} search={search}>{h.name}</Link> <span className="font-mono text-xs text-muted">{h.ticker}</span></td>
                  <td className="font-mono">{h.assetId.toUpperCase()}</td>
                  <td><Qty n={h.holdings} /></td>
                  <td><Money n={h.currentValueUsd} /></td>
                  <td className="font-mono">{h.supplySharePct == null ? "—" : h.supplySharePct.toFixed(3)}</td>
                  <td>{KIND[h.kind]}</td>
                  <td className="text-xs">디렉터리 · 일자 없음</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Panel title="SEC에서 읽은 변화" aside="디렉터리 합계에 다시 더하지 않음">
        <ul className="space-y-2 text-sm">
          {desk.dat.disclosures.map((d) => (
            <li key={d.id}><Link to="/dat/$companyId" params={{ companyId: d.companyId }} search={search} className="font-mono">{d.companyId.toUpperCase()}</Link> {d.excerpt}</li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 text-sm">
          {desk.dat.reconciliations.map((r) => (
            <li key={r.companyId + r.assetId}>{r.companyId.toUpperCase()} {r.assetId.toUpperCase()}: {r.note}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
