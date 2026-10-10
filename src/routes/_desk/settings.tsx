import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Panel, useDesk, When } from "@/components/desk-ui";
import { refreshResearch, refreshSocial } from "@/lib/desk/api";
import { useWatch } from "@/lib/desk/watch-store";

export const Route = createFileRoute("/_desk/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const desk = useDesk();
  const router = useRouter();
  const log = useWatch((s) => s.log);
  const pushLog = useWatch((s) => s.pushLog);
  const research = useServerFn(refreshResearch);
  const social = useServerFn(refreshSocial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function run(scope: string, fn: () => Promise<unknown>) {
    setBusy(scope);
    try {
      await fn();
      pushLog(scope, "완료");
      setMsg(`${scope} 반영`);
      await router.invalidate();
    } catch (err) {
      const text = err instanceof Error ? err.message : "실패";
      pushLog(scope, text);
      setMsg(text);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <Panel title="연결" aside={desk.mode === "live" ? "수집 직후" : "혼합 또는 스냅샷"}>
        <ul className="space-y-2 text-sm">
          {desk.modules.map((m) => (
            <li key={m.id} className="border-b border-line pb-2">
              <p className="font-medium">{m.label} · {m.state}</p>
              <p className="text-muted">{m.detail}</p>
              <When iso={m.checkedAt} />
            </li>
          ))}
        </ul>
        {desk.warnings.map((w) => (
          <p key={w.scope + w.message} className="mt-2 text-sm text-muted">{w.message}</p>
        ))}
      </Panel>
      <Panel title="다시 받기">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="h-9 rounded-md bg-accent px-3 text-sm text-accent-fg disabled:opacity-60" disabled={busy != null} onClick={() => void run("공시·ETF", () => research({}))}>
            {busy === "공시·ETF" ? "받는 중" : "공시·ETF 다시 받기"}
          </button>
          <button type="button" className="h-9 rounded-md border border-line px-3 text-sm disabled:opacity-60" disabled={busy != null} onClick={() => void run("X", () => social({}))}>
            {busy === "X" ? "검색 중" : "X 한 번 검색"}
          </button>
        </div>
        {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
        <p className="mt-2 text-xs text-muted">X 검색은 버튼을 눌렀을 때만 호출되고 계정 할당량을 씁니다. 상단 ‘시세 갱신’은 OKX·업비트만 다시 받습니다.</p>
      </Panel>
      <Panel title="막힌 것">
        <ul className="list-disc space-y-2 pl-4 text-sm">
          <li>SoSoValue: 서버에 SOSOVALUE_API_KEY가 없습니다. 키를 배포 비밀로 넣으면 발행사 API의 순유입으로 바꿀 수 있습니다. 지금은 공개 ETF 표입니다.</li>
          <li>Farside 원문 HTML은 Cloudflare 403입니다. 숫자는 ByKaranteli 공개 페이지에서 읽고, 그 페이지가 밝히는 업스트림을 같이 적습니다.</li>
          <li>Binance 현물은 451입니다. OKX와 업비트를 씁니다.</li>
          <li>업비트 공지 웹소켓은 사설 키가 필요합니다. KRW 상장 여부는 공개 마켓 목록만 봅니다. 입출금 공지는 연결되지 않았습니다.</li>
          <li>Reddit은 연결하지 않았습니다. 소셜 분석의 전제가 아닙니다.</li>
          <li>알림 실행은 앱이 열려 있을 때만입니다. 백그라운드 워커가 없습니다.</li>
        </ul>
      </Panel>
      <Panel title="이 브라우저의 갱신 기록">
        <ul className="text-sm">
          {log.map((row) => <li key={row.at + row.scope}><When iso={row.at} /> {row.scope} {row.result}</li>)}
          {!log.length ? <li className="text-muted">아직 없음</li> : null}
        </ul>
      </Panel>
    </div>
  );
}
