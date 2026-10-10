import { S as useSearch, T as require_jsx_runtime, b as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as Route } from "./_ssr/router-CqXd9UYe.mjs";
import { r as StepChart } from "./_ssr/charts-BedTQwVx.mjs";
import { i as Panel, n as Ext, p as useDesk, r as Money, s as Qty } from "./_ssr/desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_companyId-RvzGsCtQ.js
var import_jsx_runtime = require_jsx_runtime();
function CompanyPage() {
	const { companyId } = Route.useParams();
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const holdings = desk.dat.holdings.filter((h) => h.companyId === companyId);
	const discs = desk.dat.disclosures.filter((d) => d.companyId === companyId);
	const recs = desk.dat.reconciliations.filter((r) => r.companyId === companyId);
	const name = holdings[0]?.name ?? discs[0]?.companyId ?? companyId;
	if (!holdings.length && !discs.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm",
		children: "이 회사 행이 없습니다."
	});
	const steps = discs.filter((d) => d.endingQty != null && d.assetId === (discs.find((x) => x.endingQty)?.assetId ?? "")).sort((a, b) => a.asOf < b.asOf ? -1 : 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					holdings[0]?.ticker,
					" · ",
					holdings[0]?.country
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold",
				children: name
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "보유",
				aside: "자산마다 한 행",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: holdings.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap justify-between gap-2 border-b border-line py-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/coins/$assetId",
								params: { assetId: h.assetId },
								search,
								className: "font-mono",
								children: h.assetId.toUpperCase()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qty, { n: h.holdings }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: h.currentValueUsd }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: ["디렉터리 취득원가 ", h.entryValueUsd == null ? "미기재(0을 원가로 보지 않음)" : ""]
							}),
							h.entryValueUsd != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: h.entryValueUsd }) : null
						]
					}, h.assetId))
				})
			}),
			steps.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "공시 잔고",
				aside: "SEC 파싱. 디렉터리와 다른 축",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepChart, { rows: steps.map((d) => ({
					day: d.asOf.slice(0, 10),
					qty: d.endingQty ?? 0
				})) })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "매수·잔고·재원",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3 text-sm",
					children: discs.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-b border-line pb-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								d.classification === "purchase" ? "매수" : "잔고",
								" · ",
								d.assetId.toUpperCase(),
								" · ",
								d.asOf.slice(0, 10)
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: d.excerpt }),
							d.stakingQty != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									"스테이킹 ",
									d.stakingQty.toLocaleString("en-US"),
									"는 보유에 더하지 않음."
								]
							}) : null,
							d.proceedsFromEquityUsd != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs",
								children: [
									"주식 순수입으로 매수 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: d.proceedsFromEquityUsd }),
									" · 현금 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: d.cashUsedUsd }),
									". 발행 한도가 아니라 이번 매수 재원."
								]
							}) : null,
							d.cashAndSecuritiesUsd != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs",
								children: ["현금·유가증권 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: d.cashAndSecuritiesUsd })]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
								href: d.sourceUrl,
								children: "원문"
							})
						]
					}, d.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "대사",
				children: recs.length ? recs.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm",
					children: [
						r.assetId.toUpperCase(),
						" ",
						r.beginAsOf.slice(0, 10),
						" ",
						r.beginQty.toLocaleString("en-US"),
						" → ",
						r.endAsOf.slice(0, 10),
						" ",
						r.endQty.toLocaleString("en-US"),
						". 매수 ",
						r.buys.toLocaleString("en-US"),
						", 매도 ",
						r.sales.toLocaleString("en-US"),
						", 보상 ",
						r.rewards.toLocaleString("en-US"),
						". ",
						r.note
					]
				}, r.assetId)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "비교 가능한 두 잔고가 없습니다."
				})
			})
		]
	});
}
//#endregion
export { CompanyPage as component };
