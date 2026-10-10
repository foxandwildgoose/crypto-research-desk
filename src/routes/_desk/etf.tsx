import { createFileRoute, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { FlowChart } from "@/components/charts";
import { Ext, Money, Panel, useDesk, When } from "@/components/desk-ui";
import { EtfCatalogGroups } from "@/components/etf-catalog";
import { refreshEtfCatalog } from "@/lib/desk/api";
import {
  filterEtfRecords,
  groupEtfRecords,
  summarizeEtfRecords,
  STATUS_LABEL,
  TYPE_LABEL,
} from "@/lib/desk/etf";
import { etfStrength, sessionWindow } from "@/lib/desk/rules";

export const Route = createFileRoute("/_desk/etf")({
  component: EtfPage,
});

const TABS = [
  "overview",
  "approved",
  "applications",
  "historical",
  "unverified",
  "flows",
  "calendar",
] as const;
const TAB_LABEL = {
  overview: "개요",
  approved: "승인·거래",
  applications: "신청·심사",
  historical: "과거 이력",
  unverified: "미검증",
  flows: "자금",
  calendar: "일정",
} as const;

function EtfPage() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const router = useRouter();
  const runRefresh = useServerFn(refreshEtfCatalog);
  const [busy, setBusy] = useState(false);
  const [refreshNote, setRefreshNote] = useState("");
  const [asset, setAsset] = useState("");
  const [productType, setProductType] = useState("");
  const [issuer, setIssuer] = useState("");
  const [status, setStatus] = useState("");
  const tab =
    search.tab === "products"
      ? "approved"
      : TABS.includes(search.tab as (typeof TABS)[number])
        ? (search.tab as (typeof TABS)[number])
        : "overview";
  const catalog = desk.etf.catalog;
  const records = catalog?.records ?? [];
  const groups = groupEtfRecords(records);
  const issuers = [
    ...new Set(records.flatMap((record) => (record.issuer ? [record.issuer] : []))),
  ].sort((a, b) => a.localeCompare(b));
  const statuses = [...new Set(records.map((record) => record.status))];
  const counts = summarizeEtfRecords(records);
  const visible = filterEtfRecords(records, {
    query: search.q,
    asset,
    productType,
    issuer,
    status,
    section: tab === "overview" || tab === "flows" || tab === "calendar" ? undefined : tab,
  });
  const isCatalogTab = tab !== "flows" && tab !== "calendar";
  const assets = [...new Set(desk.etf.products.map((p) => p.assetId))];
  const focus = assets.includes(search.q.toLowerCase()) ? search.q.toLowerCase() : assets[0];
  const sessions = desk.etf.sessions.filter((s) => s.assetId === focus);

  async function refresh() {
    if (busy) return;
    setBusy(true);
    setRefreshNote("");
    try {
      const updated = await runRefresh();
      await router.invalidate();
      setRefreshNote(
        updated.etf.catalog?.refreshError
          ? "1차 자료 갱신을 완료하지 못했습니다. 기존 기록과 검증 시각을 유지합니다."
          : "ETF 자료 갱신을 완료했습니다.",
      );
    } catch {
      setRefreshNote(
        "ETF 자료 갱신에 실패했습니다. 기존 기록을 유지합니다. 잠시 후 다시 시도하세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">크립토 ETF</h1>
          <p className="mt-1 text-sm text-muted">
            상품과 규제 신청을 자산별로 탐색합니다. 자금 데이터의 범위는 별도입니다.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm disabled:opacity-60"
          disabled={busy}
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {busy ? "자료 확인 중…" : "ETF 자료 갱신"}
        </button>
      </header>
      <section
        className="rounded-md border border-line bg-surface p-3"
        aria-label="ETF 자료 범위와 검증 상태"
      >
        <p className="text-sm font-medium">범위: {catalog?.scope ?? "ETF 자료 범위 미확인"}</p>
        <p className={`mt-1 text-sm leading-6 ${catalog?.complete ? "text-muted" : "text-warn"}`}>
          {catalog?.coverageNote ??
            "검증된 ETF 카탈로그를 확보하지 못했습니다. 전체 승인 상품과 신청 수는 미확인입니다."}
        </p>
        {!catalog?.complete ? (
          <p className="mt-1 text-xs text-muted">
            아래 집계는 확인된 저장 기록만 반영합니다. 기록 없음은 시장 전체의 0개를 뜻하지
            않습니다. 미검증 기록은 승인·신청 수에서 제외합니다.
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <p>자료 갱신 {catalog?.updatedAt ? <When iso={catalog.updatedAt} /> : "미확인"}</p>
          <p>
            최근 확인 시도{" "}
            {catalog?.lastAttemptAt ? <When iso={catalog.lastAttemptAt} /> : "미확인"}
          </p>
        </div>
        {catalog?.refreshError ? (
          <p className="mt-2 break-words text-xs text-warn">갱신 제한: {catalog.refreshError}</p>
        ) : null}
        <p
          className={`text-xs text-muted ${busy || refreshNote ? "mt-2" : "sr-only"}`}
          role="status"
        >
          {busy ? "ETF 자료 갱신 중" : refreshNote}
        </p>
      </section>
      <nav className="flex flex-wrap gap-2" aria-label="ETF 데이터 구분">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            className={`min-h-11 rounded-md px-3 text-sm ${tab === id ? "bg-accent text-accent-fg" : "border border-line bg-surface"}`}
            onClick={() => {
              setStatus("");
              void navigate({ to: ".", search: (p) => ({ ...p, tab: id }) });
            }}
          >
            {TAB_LABEL[id]}
          </button>
        ))}
      </nav>
      {isCatalogTab ? (
        <>
          {tab === "overview" ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["승인·거래 자산", counts.approvedAssets],
                ["승인·거래 상품", counts.approvedProducts],
                ["활성 신청 자산", counts.applicationAssets],
                ["활성 신청", counts.applications],
              ].map(([label, count]) => (
                <div key={label} className="rounded-md border border-line bg-surface p-3">
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-2 font-mono text-xl tabular-nums">
                    {!catalog?.complete && count === 0 ? "미확인" : count}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {catalog?.complete ? "자료 범위 내 집계" : "검증 기록 기준 · 전체 규모 미확인"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-4">
            <label className="min-w-0 text-xs text-muted">
              자산
              <select
                className="mt-1 block min-h-11 w-full rounded-md border border-line bg-surface px-2 text-sm text-ink"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              >
                <option value="">자산 전체</option>
                {groups.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.key === "basket"
                      ? "다중 자산 · 바스켓"
                      : `${group.symbol} · ${group.name}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-xs text-muted">
              노출 유형
              <select
                className="mt-1 block min-h-11 w-full rounded-md border border-line bg-surface px-2 text-sm text-ink"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
              >
                <option value="">유형 전체</option>
                {Object.entries(TYPE_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-xs text-muted">
              발행사
              <select
                className="mt-1 block min-h-11 w-full rounded-md border border-line bg-surface px-2 text-sm text-ink"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
              >
                <option value="">발행사 전체</option>
                {issuers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-xs text-muted">
              규제 상태
              <select
                className="mt-1 block min-h-11 w-full rounded-md border border-line bg-surface px-2 text-sm text-ink"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">상태 전체</option>
                {statuses.map((id) => (
                  <option key={id} value={id}>
                    {STATUS_LABEL[id]}
                  </option>
                ))}
              </select>
            </label>
            {search.q || asset || productType || issuer || status ? (
              <button
                type="button"
                className="min-h-11 rounded-md border border-line px-3 text-sm"
                onClick={() => {
                  setAsset("");
                  setProductType("");
                  setIssuer("");
                  setStatus("");
                  void navigate({ to: ".", search: (p) => ({ ...p, q: "" }) });
                }}
              >
                검색·필터 초기화
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted">
            {TAB_LABEL[tab]} · 조건에 맞는 저장 기록 {visible.length}개 · 상단 검색: 코인, 티커,
            상품명, 발행사
          </p>
          {tab === "unverified" ? (
            <p className="text-sm leading-6 text-muted">
              2차 자금 자료의 상품 행만으로 승인·거래 상태를 확정하지 않습니다. 아래 기록은 1차 자료
              검증을 기다립니다.
            </p>
          ) : null}
          <EtfCatalogGroups
            records={visible}
            search={search}
            emptyMessage={
              search.q || asset || productType || issuer || status
                ? "조건에 맞는 저장 기록이 없습니다. 검색과 필터를 확인하세요."
                : !catalog?.complete
                  ? "이 구분의 검증 기록을 아직 확보하지 못했습니다. 승인·신청이 시장 전체에 없다는 뜻이 아닙니다. 미검증 탭과 자료 범위를 확인하세요."
                  : "이 자료 범위에 해당하는 기록이 없습니다."
            }
          />
        </>
      ) : null}
      {tab === "flows" ? (
        <>
          <p className="text-xs leading-5 text-muted">{desk.etf.coverageNote}</p>
          <div className="flex flex-wrap gap-2">
            {assets.map((id) => (
              <button
                key={id}
                type="button"
                className={`h-9 rounded-md px-3 font-mono text-sm ${focus === id ? "bg-chip" : "border border-line"}`}
                onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, q: id }) })}
              >
                {id.toUpperCase()}
              </button>
            ))}
          </div>
          <Panel title={`${focus?.toUpperCase() ?? ""} 순유입`} aside={desk.etf.provenance.note}>
            <FlowChart
              rows={[...sessions]
                .reverse()
                .filter((s) => s.netFlowUsd != null)
                .map((s) => ({ day: s.date, flow: s.netFlowUsd ?? 0 }))}
            />
            <p className="text-sm">{sessions.length ? etfStrength(sessions).why : "세션 없음"}</p>
            <p className="text-xs text-muted">
              5세션 {labelSum(sessionWindow(sessions, 0, 5).sum)} · 20세션{" "}
              {labelSum(sessionWindow(sessions, 0, 20).sum)} · 휴장일은 행이 없어 0이 아님
            </p>
          </Panel>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="px-2 py-1">날짜</th>
                  <th>순유입</th>
                  <th>거래대금</th>
                  <th>순자산</th>
                  <th>누적</th>
                  <th>+/−/0</th>
                  <th>결측</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 24).map((s) => (
                  <tr key={s.date} className="border-t border-line">
                    <td className="px-2 py-1 font-mono">{s.date}</td>
                    <td>
                      <Money n={s.netFlowUsd} />
                    </td>
                    <td>
                      <Money n={s.valueTradedUsd} />
                    </td>
                    <td>
                      <Money n={s.netAssetsUsd} />
                    </td>
                    <td>
                      <Money n={s.cumFlowUsd} />
                    </td>
                    <td className="font-mono text-xs">
                      {s.positiveIssuers ?? "—"}/{s.negativeIssuers ?? "—"}/{s.flatIssuers ?? "—"}
                    </td>
                    <td className="text-xs">
                      {s.partial ? s.missingTickers.join(", ") || "부분" : "보고분 완전"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Heat deskAsset={focus} />
          <details className="text-sm">
            <summary className="cursor-pointer">펀드별 최근 세션</summary>
            <ul className="mt-2 space-y-1">
              {desk.etf.products
                .filter((p) => p.assetId === focus)
                .map((p) => (
                  <li
                    key={p.ticker}
                    className="flex justify-between gap-3 border-b border-line py-1"
                  >
                    <span className="font-mono">{p.ticker}</span>
                    <span>{p.issuer}</span>
                    <Money n={p.dailyFlowUsd} applicable={p.dailyFlowUsd != null} />
                  </li>
                ))}
            </ul>
          </details>
        </>
      ) : null}
      {tab === "calendar" ? (
        <ul className="space-y-3">
          {desk.etf.milestones.map((m) => (
            <li key={m.id} className="rounded-md border border-line bg-surface p-3 text-sm">
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-muted">
                {m.date ?? "날짜 미확인"} · {m.uncertainty}
              </p>
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
              {dates.slice(-12).map((d) => (
                <th key={d} className="px-1 font-mono">
                  {d.slice(5)}
                </th>
              ))}
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
                    <td
                      key={d}
                      className={`px-1 font-mono tabular-nums ${m == null ? "text-muted" : m > 0 ? "text-up" : m < 0 ? "text-down" : ""}`}
                    >
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
