import { Link, useNavigate, useRouter, useRouterState, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Building2, Coins, Landmark, LayoutDashboard, Newspaper, Radar, RefreshCw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { refreshMarket } from "@/lib/desk/api";
import type { DeskSearch } from "@/lib/desk/search";
import { useWatch } from "@/lib/desk/watch-store";

const NAV = [
  { to: "/", label: "오늘", full: "오늘의 투자판", icon: LayoutDashboard },
  { to: "/coins", label: "코인", full: "코인 탐색", icon: Coins },
  { to: "/etf", label: "ETF", full: "ETF 자금·일정", icon: Landmark },
  { to: "/dat", label: "기업", full: "기업 코인 보유", icon: Building2 },
  { to: "/meme", label: "밈", full: "밈 레이더", icon: Radar },
  { to: "/intel", label: "뉴스", full: "뉴스·주요인물", icon: Newspaper },
  { to: "/watch", label: "관심", full: "관심·알림", icon: Bookmark },
  { to: "/settings", label: "설정", full: "연결·갱신", icon: Settings },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const search = useSearch({ from: "/_desk" });
  const navigate = useNavigate();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const runMarket = useServerFn(refreshMarket);
  const pushLog = useWatch((s) => s.pushLog);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    void useWatch.persist.rehydrate();
    const saved = localStorage.getItem("investpan-theme");
    const next = saved === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  function patch(partial: Partial<DeskSearch>) {
    void navigate({ to: ".", search: (prev) => ({ ...prev, ...partial }) });
  }

  async function onRefresh() {
    setBusy(true);
    try {
      await runMarket({});
      pushLog("시세", "OKX·업비트 재조회");
      await router.invalidate();
    } catch (err) {
      pushLog("시세", err instanceof Error ? err.message : "실패");
    } finally {
      setBusy(false);
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("investpan-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-52 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-4 py-4">
          <p className="text-xs tracking-wide text-muted">리서치</p>
          <p className="text-lg font-semibold">투자판</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV.map((item) => {
            const on = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                search={search}
                className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm ${on ? "bg-chip font-medium" : "text-muted hover:bg-chip hover:text-ink"}`}
              >
                <Icon className="size-4" aria-hidden />
                {item.full}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-52">
        <header className="sticky top-0 z-10 border-b border-line bg-bg">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <label className="min-w-40 flex-1">
              <span className="sr-only">자산 검색</span>
              <input
                value={search.q}
                onChange={(e) => patch({ q: e.target.value })}
                placeholder="심볼, 이름"
                className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"
              />
            </label>
            <select className="h-9 rounded-md border border-line bg-surface px-2 text-sm" value={search.h} onChange={(e) => patch({ h: e.target.value === "s" ? "s" : "t" })}>
              <option value="t">전술 1일–4주</option>
              <option value="s">전략 1–3년</option>
            </select>
            <select className="h-9 rounded-md border border-line bg-surface px-2 text-sm" value={search.w} onChange={(e) => patch({ w: e.target.value === "7" || e.target.value === "90" ? e.target.value : "30" })}>
              <option value="7">7일</option>
              <option value="30">30일</option>
              <option value="90">90일</option>
            </select>
            <button type="button" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" onClick={toggleTheme}>
              {theme === "dark" ? "라이트" : "다크"}
            </button>
            <button type="button" className="inline-flex h-9 items-center gap-1 rounded-md bg-accent px-3 text-sm text-accent-fg disabled:opacity-60" onClick={() => void onRefresh()} disabled={busy}>
              <RefreshCw className="size-4" aria-hidden />
              {busy ? "시세 갱신 중" : "시세 갱신"}
            </button>
          </div>
        </header>
        <main className="min-w-0 px-3 py-3 pb-24 lg:pb-6">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-line bg-surface px-2 py-1 lg:hidden">
        {NAV.map((item) => {
          const on = item.to === "/" ? path === "/" : path.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} search={search} className={`flex h-11 shrink-0 items-center rounded-md px-3 text-sm ${on ? "bg-chip font-medium" : "text-muted"}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
