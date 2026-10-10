import { S as useSearch, T as require_jsx_runtime, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Panel, n as Ext, p as useDesk, u as When } from "./desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/intel-BB0UwNwx.js
var import_jsx_runtime = require_jsx_runtime();
function IntelPage() {
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const navigate = useNavigate();
	const tab = search.tab === "people" ? "people" : "feed";
	const handles = [...new Set(desk.social.posts.map((p) => p.handle))];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `h-9 rounded-md px-3 text-sm ${tab === "feed" ? "bg-accent text-accent-fg" : "border border-line"}`,
					onClick: () => void navigate({
						to: ".",
						search: (p) => ({
							...p,
							tab: "feed"
						})
					}),
					children: "사건"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `h-9 rounded-md px-3 text-sm ${tab === "people" ? "bg-accent text-accent-fg" : "border border-line"}`,
					onClick: () => void navigate({
						to: ".",
						search: (p) => ({
							...p,
							tab: "people"
						})
					}),
					children: "계정"
				})]
			}),
			desk.social.blockedReason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-md border border-warn px-3 py-2 text-sm text-warn",
				children: [
					"X: ",
					desk.social.blockedReason,
					" 공시·기사는 아래에 남아 있습니다."
				]
			}) : null,
			tab === "feed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-3",
				children: desk.news.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-md border border-line bg-surface p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								n.source,
								" · ",
								n.route,
								" · ",
								n.category,
								" · ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(When, { iso: n.published ?? n.firstSeen })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-semibold",
							children: n.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: n.excerpt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: n.summaryKo
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs",
							children: ["새로움: ", n.whatsNew]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: ["반대 설명: ", n.counter]
						}),
						n.assetIds.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs",
							children: n.assetIds.join(", ").toUpperCase()
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
							href: n.url,
							children: "원문"
						})
					]
				}, n.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-2",
				children: [handles.map((handle) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: `@${handle}`,
					aside: handle === "theunipcs" ? "밈 언급 시드. 실력 가정 없음" : handle === "saylor" ? "Strategy 의장 발언. 회사 공시와 구분" : "",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 text-sm",
						children: desk.social.posts.filter((p) => p.handle === handle).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									p.kind,
									" · ",
									p.published
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p.text }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
								href: p.url,
								children: "링크"
							})
						] }, p.id))
					})
				}, handle)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "역할",
					aside: "확인된 것만",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-6",
						children: "Tom Lee는 Bitmine 보도자료에서 Executive Chairman으로 나옵니다. CEO로 적지 않습니다. Fundstrat 시황과 Bitmine 보유 발언은 계정 타임라인에서 섞지 않으려고, 이번 스냅샷의 X 검색은 @saylor와 @theunipcs만 고정했습니다. Bitmine 수량은 SEC exhibit입니다."
					})
				})]
			})
		]
	});
}
//#endregion
export { IntelPage as component };
