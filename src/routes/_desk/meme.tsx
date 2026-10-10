import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AssetLink, Ext, Money, Panel, Pct, SaveButton, useDesk, quoteOf } from "@/components/desk-ui";

export const Route = createFileRoute("/_desk/meme")({
  component: MemePage,
});

function MemePage() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const tab = search.tab === "early" || search.tab === "kol" ? search.tab : "practical";
  const practical = desk.memes.filter((m) => m.perpVenues.length > 0);
  const early = desk.memes.filter((m) => m.perpVenues.length === 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`h-9 rounded-md px-3 text-sm ${tab === "practical" ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: "practical" }) })}>실무 후보 · 선물 있음</button>
        <button type="button" className={`h-9 rounded-md px-3 text-sm ${tab === "early" ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: "early" }) })}>초기 발견</button>
        <button type="button" className={`h-9 rounded-md px-3 text-sm ${tab === "kol" ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: "kol" }) })}>계정 타임라인</button>
      </div>
      <p className="text-xs text-muted">선물 상장은 레버리지 권유가 아닙니다. 유동성은 수요의 증거가 아닙니다. @theunipcs는 시드 계정일 뿐 실력을 가정하지 않습니다.</p>
      {tab === "kol" ? (
        <ul className="space-y-3">
          {desk.social.posts.map((p) => (
            <li key={p.id} className="rounded-md border border-line bg-surface p-3 text-sm">
              <p className="text-xs text-muted">@{p.handle} · {p.kind} · {p.published ?? "시각 미상"} {p.disclosure ? `· ${p.disclosure}` : ""}</p>
              <p className="mt-1 whitespace-pre-wrap">{p.text}</p>
              <p className="text-xs text-muted">{p.summaryKo}</p>
              <Ext href={p.url}>원문</Ext>
            </li>
          ))}
          {!desk.social.posts.length ? <li className="text-sm text-muted">{desk.social.blockedReason ?? "게시물 없음"}</li> : null}
        </ul>
      ) : (
        <Panel title={tab === "practical" ? "USDT-M이 확인된 후보" : "선물 조건 없는 풀"} aside={tab === "early" ? "정보·유동성 불확실성이 더 큼" : "기본 필터"}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr><th>토큰</th><th>정체</th><th>언급</th><th>24h</th><th>거래량</th><th>풀 유동성</th><th>장소</th><th>리스크</th><th /></tr>
              </thead>
              <tbody>
                {(tab === "practical" ? practical : early).map((m) => {
                  const asset = desk.assets.find((a) => a.id === m.assetId);
                  const quote = quoteOf(desk, m.assetId);
                  return (
                    <tr key={m.assetId} className="border-t border-line align-top">
                      <td className="py-2">{asset ? <AssetLink id={asset.id} search={search} symbol={asset.symbol} name={asset.nameKo} /> : m.assetId}</td>
                      <td className="max-w-40 text-xs">{m.identityNote}</td>
                      <td className="text-xs">{m.mention ?? "표본에 없음"}<br />{m.attentionNote}</td>
                      <td><Pct n={quote?.change24hPct} /></td>
                      <td><Money n={m.volume24hUsd} /></td>
                      <td className="text-xs">{m.liquidityUsd == null ? "—" : <>{m.liquidityKind === "dex-pool" ? "DEX 풀 " : "호가 거래대금 "}<Money n={m.liquidityUsd} /></>}</td>
                      <td className="text-xs">{[...m.spotVenues, ...m.perpVenues].join(" · ") || "—"}{m.krwListed ? " · KRW" : " · KRW 목록 없음"}</td>
                      <td className="max-w-xs text-xs">{m.risk}</td>
                      <td><SaveButton assetId={m.assetId} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
