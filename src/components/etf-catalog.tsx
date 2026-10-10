import { Link } from "@tanstack/react-router";
import { Ext, Panel, When } from "@/components/desk-ui";
import { groupEtfRecords, STATUS_LABEL, TYPE_LABEL } from "@/lib/desk/etf";
import type { CryptoEtfRecord } from "@/lib/desk/types";
import type { DeskSearch } from "@/lib/desk/search";

const AUTHORITY_LABEL = {
  regulator: "규제기관",
  exchange: "거래소",
  issuer: "발행사",
  secondary: "2차 자료",
} as const;

export function EtfCatalogGroups({
  records,
  search,
  emptyMessage,
}: {
  records: CryptoEtfRecord[];
  search?: DeskSearch;
  emptyMessage?: string;
}) {
  const groups = groupEtfRecords(records);
  if (!groups.length)
    return (
      <Panel title="ETF 기록">
        <p className="text-sm leading-6 text-muted">
          {emptyMessage ?? "조건에 맞는 저장 기록이 없습니다. 검색과 필터를 확인하세요."}
        </p>
      </Panel>
    );
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.key} className="min-w-0 rounded-md border border-line bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-3">
            <div>
              <h2 className="text-sm font-semibold">
                {!["basket", "unknown"].includes(group.key) && search ? (
                  <Link
                    to="/coins/$assetId"
                    params={{ assetId: group.key }}
                    search={{ ...search, tab: "etf" }}
                    className="hover:text-accent"
                  >
                    <span className="font-mono">{group.symbol}</span>{" "}
                    <span className="ml-2">{group.name}</span>
                  </Link>
                ) : (
                  <>
                    <span className="font-mono">{group.symbol}</span>{" "}
                    <span className="ml-2">
                      {group.key === "basket"
                        ? "다중 자산 · 크립토 바스켓"
                        : group.key === "unknown"
                          ? "기초 자산 미확인"
                          : group.name}
                    </span>
                  </>
                )}
              </h2>
              {group.key === "basket" ? (
                <p className="mt-1 text-xs text-muted">
                  개별 코인의 단일 자산 ETF 수에 포함하지 않습니다.
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted">
              저장 기록 {group.records.length}개 중 · 승인·거래 {group.approvedCount} · 활성 신청{" "}
              {group.applicationCount}
            </p>
          </header>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                {group.symbol} ETF 상품과 신청, 규제 상태와 출처
              </caption>
              <thead className="bg-bg text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    상품 · 티커
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    발행사 · 시장
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    노출 · 상태
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    공시 날짜 · 근거
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.records.map((record) => (
                  <tr key={record.id} className="border-t border-line align-top">
                    <td className="max-w-xs px-3 py-3">
                      <p className="font-medium">{record.productName ?? "상품명 미확인"}</p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {record.ticker ?? "티커 미확인"}
                      </p>
                      {group.key === "basket" ? <Underlying record={record} /> : null}
                    </td>
                    <td className="px-3 py-3">
                      <p>{record.issuer ?? "발행사 미확인"}</p>
                      <p className="mt-1 text-xs text-muted">
                        {record.jurisdiction} · {record.exchange ?? "거래소 미확인"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <RecordStatus record={record} />
                    </td>
                    <td className="max-w-sm px-3 py-3">
                      <RecordEvidence record={record} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line md:hidden">
            {group.records.map((record) => (
              <li key={record.id} className="space-y-3 p-3 text-sm">
                <div>
                  <h3 className="font-medium">{record.productName ?? "상품명 미확인"}</h3>
                  <p className="mt-1 text-xs text-muted">
                    <span className="font-mono">{record.ticker ?? "티커 미확인"}</span> ·{" "}
                    {record.issuer ?? "발행사 미확인"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {record.jurisdiction} · {record.exchange ?? "거래소 미확인"}
                  </p>
                </div>
                {group.key === "basket" ? <Underlying record={record} /> : null}
                <RecordStatus record={record} />
                <RecordEvidence record={record} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Underlying({ record }: { record: CryptoEtfRecord }) {
  return (
    <p className="mt-2 break-words text-xs text-muted">
      구성:{" "}
      {record.underlyingAssets.length
        ? record.underlyingAssets
            .map(
              (asset) =>
                `${asset.symbol} (${asset.weightPct == null ? "비중 미확인" : `${asset.weightPct}%`})`,
            )
            .join(" · ")
        : "구성 자산 미확인"}
    </p>
  );
}

function RecordStatus({ record }: { record: CryptoEtfRecord }) {
  return (
    <div className="space-y-1">
      <p className="text-xs">
        {TYPE_LABEL[record.productType]}
        {record.productType !== "basket" &&
        (record.multiAsset || record.underlyingAssets.length > 1)
          ? " · 다중 자산"
          : ""}
      </p>
      <p
        className={`inline-flex rounded-md bg-chip px-2 py-1 text-xs ${record.status === "unverified" ? "text-warn" : "text-ink"}`}
      >
        {STATUS_LABEL[record.status]}
      </p>
      <p className="text-xs text-muted">
        상태 기준일 {record.statusAsOf?.slice(0, 10) ?? "미확인"}
      </p>
      <p className="text-xs text-muted">규제기관 {record.regulator ?? "미확인"}</p>
    </div>
  );
}

function RecordEvidence({ record }: { record: CryptoEtfRecord }) {
  return (
    <div className="space-y-1 text-xs">
      <p className="text-muted">
        신청 {record.filingDate ?? "미확인"} · 승인 {record.approvalDate ?? "미확인"}
      </p>
      <p className="text-muted">
        출시 {record.launchDate ?? "미확인"} · 마감 {record.deadline ?? "미확인"}
      </p>
      <p className="text-muted">
        최종 검증 {record.lastVerifiedAt ? <When iso={record.lastVerifiedAt} /> : "미확인"}
      </p>
      <div className="flex flex-wrap gap-3">
        <Ext href={record.sourceUrl}>출처</Ext>
        {record.filingUrl ? <Ext href={record.filingUrl}>신청 원문</Ext> : null}
      </div>
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center text-accent">
          근거와 검증 메모 ({record.evidence.length})
        </summary>
        {record.note ? <p className="mb-2 leading-5 text-muted">{record.note}</p> : null}
        {record.evidence.length ? (
          <ul className="space-y-3">
            {record.evidence.map((evidence, index) => (
              <li key={`${evidence.url}-${index}`} className="space-y-1 border-l border-line pl-2">
                <p>
                  {AUTHORITY_LABEL[evidence.authority]} ·{" "}
                  <Ext href={evidence.url}>{evidence.title}</Ext>
                </p>
                <p className="leading-5 text-muted">{evidence.excerpt || "원문 발췌 없음"}</p>
                <p className="text-muted">
                  문서 기준일 {evidence.asOf?.slice(0, 10) ?? "미확인"} · 확인한 상태{" "}
                  {evidence.status ? STATUS_LABEL[evidence.status] : "미확인"}
                </p>
                <p className="text-muted">
                  근거 검증 {evidence.verifiedAt ? <When iso={evidence.verifiedAt} /> : "미확인"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">독립 검증 근거가 확보되지 않았습니다.</p>
        )}
      </details>
    </div>
  );
}
