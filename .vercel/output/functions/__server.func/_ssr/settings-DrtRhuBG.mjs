import { i as __toESM } from "../_runtime.mjs";
import { Q as require_react, T as require_jsx_runtime, w as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as refreshResearch, s as refreshSocial } from "./router-CqXd9UYe.mjs";
import { t as useWatch } from "./watch-store-DK3fR7jm.mjs";
import { i as Panel, p as useDesk, u as When } from "./desk-ui-D-_9VvRt.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-DrtRhuBG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const desk = useDesk();
	const router = useRouter();
	const log = useWatch((s) => s.log);
	const pushLog = useWatch((s) => s.pushLog);
	const research = useServerFn(refreshResearch);
	const social = useServerFn(refreshSocial);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [msg, setMsg] = (0, import_react.useState)("");
	async function run(scope, fn) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "연결",
				aside: desk.mode === "live" ? "수집 직후" : "혼합 또는 스냅샷",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: desk.modules.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-b border-line pb-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-medium",
								children: [
									m.label,
									" · ",
									m.state
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: m.detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(When, { iso: m.checkedAt })
						]
					}, m.id))
				}), desk.warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: w.message
				}, w.scope + w.message))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "다시 받기",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-9 rounded-md bg-accent px-3 text-sm text-accent-fg disabled:opacity-60",
							disabled: busy != null,
							onClick: () => void run("공시·ETF", () => research({})),
							children: busy === "공시·ETF" ? "받는 중" : "공시·ETF 다시 받기"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-9 rounded-md border border-line px-3 text-sm disabled:opacity-60",
							disabled: busy != null,
							onClick: () => void run("X", () => social({})),
							children: busy === "X" ? "검색 중" : "X 한 번 검색"
						})]
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm",
						children: msg
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted",
						children: "X 검색은 버튼을 눌렀을 때만 호출되고 계정 할당량을 씁니다. 상단 ‘시세 갱신’은 OKX·업비트만 다시 받습니다."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "막힌 것",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "list-disc space-y-2 pl-4 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "SoSoValue: 서버에 SOSOVALUE_API_KEY가 없습니다. 키를 배포 비밀로 넣으면 발행사 API의 순유입으로 바꿀 수 있습니다. 지금은 공개 ETF 표입니다." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Farside 원문 HTML은 Cloudflare 403입니다. 숫자는 ByKaranteli 공개 페이지에서 읽고, 그 페이지가 밝히는 업스트림을 같이 적습니다." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Binance 현물은 451입니다. OKX와 업비트를 씁니다." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "업비트 공지 웹소켓은 사설 키가 필요합니다. KRW 상장 여부는 공개 마켓 목록만 봅니다. 입출금 공지는 연결되지 않았습니다." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Reddit은 연결하지 않았습니다. 소셜 분석의 전제가 아닙니다." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "알림 실행은 앱이 열려 있을 때만입니다. 백그라운드 워커가 없습니다." })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "이 브라우저의 갱신 기록",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "text-sm",
					children: [log.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(When, { iso: row.at }),
						" ",
						row.scope,
						" ",
						row.result
					] }, row.at + row.scope)), !log.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "아직 없음"
					}) : null]
				})
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
