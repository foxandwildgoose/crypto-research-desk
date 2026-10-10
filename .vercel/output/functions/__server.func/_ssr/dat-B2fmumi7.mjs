import { S as useSearch, T as require_jsx_runtime, b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Panel, p as useDesk, r as Money, s as Qty } from "./desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dat-B2fmumi7.js
var import_jsx_runtime = require_jsx_runtime();
var KIND = {
	treasury: "트레저리",
	miner: "채굴",
	operating: "운영",
	exchange: "거래소",
	other: "기타"
};
function DatPage() {
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const navigate = useNavigate();
	const tab = search.tab === "company" ? "company" : "coin";
	const kind = search.kind || "treasury";
	const rows = desk.dat.holdings.filter((h) => {
		if (kind !== "all" && h.kind !== kind) return false;
		if (!search.q) return true;
		const q = search.q.toLowerCase();
		return h.name.toLowerCase().includes(q) || h.ticker.toLowerCase().includes(q) || h.assetId.includes(q);
	});
	const coins = [...new Set(rows.map((h) => h.assetId))];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-9 rounded-md px-3 text-sm ${tab === "coin" ? "bg-accent text-accent-fg" : "border border-line"}`,
						onClick: () => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								tab: "coin"
							})
						}),
						children: "코인"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-9 rounded-md px-3 text-sm ${tab === "company" ? "bg-accent text-accent-fg" : "border border-line"}`,
						onClick: () => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								tab: "company"
							})
						}),
						children: "회사"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-line bg-surface px-2 text-sm",
						value: kind,
						onChange: (e) => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								kind: e.target.value
							})
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "treasury",
								children: "트레저리만"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "miner",
								children: "채굴"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "operating",
								children: "운영"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "exchange",
								children: "거래소"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "other",
								children: "기타"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "전체"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					desk.dat.coverageNote,
					" ",
					desk.dat.provenance.note
				]
			}),
			tab === "coin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 lg:grid-cols-2",
				children: coins.map((id) => {
					const list = rows.filter((h) => h.assetId === id);
					const sum = list.reduce((a, h) => a + h.holdings, 0);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: id.toUpperCase(),
						aside: `합성 ${list.length}사. 일자 불일치`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-2 font-mono text-sm tabular-nums",
							children: [
								"합 ",
								sum.toLocaleString("en-US", { maximumFractionDigits: 2 }),
								" · 동기 잔고 아님"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: list.slice(0, 8).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-2 border-t border-line py-1 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/dat/$companyId",
								params: { companyId: h.companyId },
								search,
								className: "hover:text-accent",
								children: h.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qty, { n: h.holdings })]
						}, h.companyId)) })]
					}, id);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-md border border-line bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[860px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-xs text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-1",
								children: "회사"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "코인" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "수량" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "평가" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "공급%" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "분류" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "출처" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.slice(0, 80).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-2 py-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/dat/$companyId",
										params: { companyId: h.companyId },
										search,
										children: h.name
									}),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs text-muted",
										children: h.ticker
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: h.assetId.toUpperCase()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qty, { n: h.holdings }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: h.currentValueUsd }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: h.supplySharePct == null ? "—" : h.supplySharePct.toFixed(3)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: KIND[h.kind] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-xs",
								children: "디렉터리 · 일자 없음"
							})
						]
					}, h.companyId + h.assetId)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "SEC에서 읽은 변화",
				aside: "디렉터리 합계에 다시 더하지 않음",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: desk.dat.disclosures.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/dat/$companyId",
							params: { companyId: d.companyId },
							search,
							className: "font-mono",
							children: d.companyId.toUpperCase()
						}),
						" ",
						d.excerpt
					] }, d.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 text-sm",
					children: desk.dat.reconciliations.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						r.companyId.toUpperCase(),
						" ",
						r.assetId.toUpperCase(),
						": ",
						r.note
					] }, r.companyId + r.assetId))
				})]
			})
		]
	});
}
//#endregion
export { DatPage as component };
