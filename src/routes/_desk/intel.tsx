import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Ext, Panel, useDesk, When } from "@/components/desk-ui";

export const Route = createFileRoute("/_desk/intel")({
  component: IntelPage,
});

function IntelPage() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const tab = search.tab === "people" ? "people" : "feed";
  const handles = [...new Set(desk.social.posts.map((p) => p.handle))];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" className={`h-9 rounded-md px-3 text-sm ${tab === "feed" ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: "feed" }) })}>사건</button>
        <button type="button" className={`h-9 rounded-md px-3 text-sm ${tab === "people" ? "bg-accent text-accent-fg" : "border border-line"}`} onClick={() => void navigate({ to: ".", search: (p) => ({ ...p, tab: "people" }) })}>계정</button>
      </div>
      {desk.social.blockedReason ? <p className="rounded-md border border-warn px-3 py-2 text-sm text-warn">X: {desk.social.blockedReason} 공시·기사는 아래에 남아 있습니다.</p> : null}
      {tab === "feed" ? (
        <ul className="space-y-3">
          {desk.news.map((n) => (
            <li key={n.id} className="rounded-md border border-line bg-surface p-3">
              <p className="text-xs text-muted">{n.source} · {n.route} · {n.category} · <When iso={n.published ?? n.firstSeen} /></p>
              <h2 className="text-base font-semibold">{n.title}</h2>
              <p className="text-sm">{n.excerpt}</p>
              <p className="text-sm text-muted">{n.summaryKo}</p>
              <p className="text-xs">새로움: {n.whatsNew}</p>
              <p className="text-xs text-muted">반대 설명: {n.counter}</p>
              {n.assetIds.length ? <p className="font-mono text-xs">{n.assetIds.join(", ").toUpperCase()}</p> : null}
              <Ext href={n.url}>원문</Ext>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {handles.map((handle) => (
            <Panel key={handle} title={`@${handle}`} aside={handle === "theunipcs" ? "밈 언급 시드. 실력 가정 없음" : handle === "saylor" ? "Strategy 의장 발언. 회사 공시와 구분" : ""}>
              <ul className="space-y-2 text-sm">
                {desk.social.posts.filter((p) => p.handle === handle).map((p) => (
                  <li key={p.id}>
                    <p className="text-xs text-muted">{p.kind} · {p.published}</p>
                    <p>{p.text}</p>
                    <Ext href={p.url}>링크</Ext>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
          <Panel title="역할" aside="확인된 것만">
            <p className="text-sm leading-6">Tom Lee는 Bitmine 보도자료에서 Executive Chairman으로 나옵니다. CEO로 적지 않습니다. Fundstrat 시황과 Bitmine 보유 발언은 계정 타임라인에서 섞지 않으려고, 이번 스냅샷의 X 검색은 @saylor와 @theunipcs만 고정했습니다. Bitmine 수량은 SEC exhibit입니다.</p>
          </Panel>
        </div>
      )}
    </div>
  );
}
