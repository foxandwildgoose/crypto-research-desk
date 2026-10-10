import { i as __toESM } from "./_runtime.mjs";
import { Q as require_react, S as useSearch, T as require_jsx_runtime, b as Link, g as Outlet, p as useRouterState, w as useRouter, x as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { a as Newspaper, c as Coins, i as Radar, l as Building2, n as Settings, o as LayoutDashboard, r as RefreshCw, s as Landmark, u as Bookmark } from "./_libs/lucide-react.mjs";
import { a as refreshMarket } from "./_ssr/router-CqXd9UYe.mjs";
import { t as useWatch } from "./_ssr/watch-store-DK3fR7jm.mjs";
import { t as useServerFn } from "./_ssr/useServerFn-CrZF2pjq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_desk-XdbBmyH_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV = [
	{
		to: "/",
		label: "오늘",
		full: "오늘의 투자판",
		icon: LayoutDashboard
	},
	{
		to: "/coins",
		label: "코인",
		full: "코인 탐색",
		icon: Coins
	},
	{
		to: "/etf",
		label: "ETF",
		full: "ETF 자금·일정",
		icon: Landmark
	},
	{
		to: "/dat",
		label: "기업",
		full: "기업 코인 보유",
		icon: Building2
	},
	{
		to: "/meme",
		label: "밈",
		full: "밈 레이더",
		icon: Radar
	},
	{
		to: "/intel",
		label: "뉴스",
		full: "뉴스·주요인물",
		icon: Newspaper
	},
	{
		to: "/watch",
		label: "관심",
		full: "관심·알림",
		icon: Bookmark
	},
	{
		to: "/settings",
		label: "설정",
		full: "연결·갱신",
		icon: Settings
	}
];
function Shell({ children }) {
	const search = useSearch({ from: "/_desk" });
	const navigate = useNavigate();
	const router = useRouter();
	const path = useRouterState({ select: (s) => s.location.pathname });
	const runMarket = useServerFn(refreshMarket);
	const pushLog = useWatch((s) => s.pushLog);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [theme, setTheme] = (0, import_react.useState)("light");
	(0, import_react.useEffect)(() => {
		useWatch.persist.rehydrate();
		const next = localStorage.getItem("investpan-theme") === "dark" ? "dark" : "light";
		setTheme(next);
		document.documentElement.classList.toggle("dark", next === "dark");
	}, []);
	function patch(partial) {
		navigate({
			to: ".",
			search: (prev) => ({
				...prev,
				...partial
			})
		});
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 z-20 hidden w-52 flex-col border-r border-line bg-surface lg:flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted",
						children: "리서치"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold",
						children: "투자판"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex flex-1 flex-col gap-1 px-2",
					children: NAV.map((item) => {
						const on = item.to === "/" ? path === "/" : path.startsWith(item.to);
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							search,
							className: `flex h-10 items-center gap-2 rounded-md px-3 text-sm ${on ? "bg-chip font-medium" : "text-muted hover:bg-chip hover:text-ink"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4",
								"aria-hidden": true
							}), item.full]
						}, item.to);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:pl-52",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "sticky top-0 z-10 border-b border-line bg-bg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "min-w-40 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "자산 검색"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: search.q,
									onChange: (e) => patch({ q: e.target.value }),
									placeholder: "심볼, 이름",
									className: "h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-9 rounded-md border border-line bg-surface px-2 text-sm",
								value: search.h,
								onChange: (e) => patch({ h: e.target.value === "s" ? "s" : "t" }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "t",
									children: "전술 1일–4주"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "s",
									children: "전략 1–3년"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-9 rounded-md border border-line bg-surface px-2 text-sm",
								value: search.w,
								onChange: (e) => patch({ w: e.target.value === "7" || e.target.value === "90" ? e.target.value : "30" }),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "7",
										children: "7일"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "30",
										children: "30일"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "90",
										children: "90일"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-9 rounded-md border border-line bg-surface px-3 text-sm",
								onClick: toggleTheme,
								children: theme === "dark" ? "라이트" : "다크"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-9 items-center gap-1 rounded-md bg-accent px-3 text-sm text-accent-fg disabled:opacity-60",
								onClick: () => void onRefresh(),
								disabled: busy,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
									className: "size-4",
									"aria-hidden": true
								}), busy ? "시세 갱신 중" : "시세 갱신"]
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "min-w-0 px-3 py-3 pb-24 lg:pb-6",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-line bg-surface px-2 py-1 lg:hidden",
				children: NAV.map((item) => {
					const on = item.to === "/" ? path === "/" : path.startsWith(item.to);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: item.to,
						search,
						className: `flex h-11 shrink-0 items-center rounded-md px-3 text-sm ${on ? "bg-chip font-medium" : "text-muted"}`,
						children: item.label
					}, item.to);
				})
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) });
//#endregion
export { SplitComponent as component };
