import { i as __toESM } from "../_runtime.mjs";
import { s as sessionWindow } from "./rules-Bg6kFJOi.mjs";
import { Q as require_react, S as useSearch, T as require_jsx_runtime, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useWatch } from "./watch-store-DK3fR7jm.mjs";
import { a as Pct, c as SaveButton, f as quoteOf, i as Panel, p as useDesk, r as Money, t as AssetLink } from "./desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/coins-XP0RXtio.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function passes(desk, search, id, saved) {
	const asset = desk.assets.find((a) => a.id === id);
	if (!asset) return false;
	if (search.q) {
		if (!`${asset.symbol} ${asset.name} ${asset.nameKo}`.toLowerCase().includes(search.q.toLowerCase())) return false;
	}
	if (search.theme && !asset.themes.includes(search.theme)) return false;
	if (search.watch === "1" && !saved) return false;
	const etf = desk.etf.products.some((p) => p.assetId === id);
	if (search.etf === "yes" && !etf) return false;
	if (search.etf === "no" && etf) return false;
	const dat = desk.dat.holdings.some((h) => h.assetId === id && h.kind === "treasury");
	if (search.dat === "yes" && !dat) return false;
	if (search.dat === "no" && dat) return false;
	const quote = quoteOf(desk, id);
	if (search.venue === "upbit" && !quote?.upbitKrw) return false;
	if (search.venue === "perp" && !quote?.perpAvailable) return false;
	return true;
}
function Coins() {
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const navigate = useNavigate();
	const saved = useWatch((s) => s.rows);
	const [sort, setSort] = (0, import_react.useState)("sym");
	const ids = desk.assets.map((a) => a.id).filter((id) => passes(desk, search, id, saved.some((r) => r.assetId === id)));
	const cmp = search.cmp.split(",").filter(Boolean).slice(0, 4);
	const rows = ids.map((id) => {
		const quote = quoteOf(desk, id);
		const sessions = desk.etf.sessions.filter((s) => s.assetId === id);
		const flow = sessionWindow(sessions, 0, 5);
		const hasEtf = desk.etf.products.some((p) => p.assetId === id);
		const dat = desk.dat.holdings.filter((h) => h.assetId === id && h.kind === "treasury");
		return {
			id,
			quote,
			flow: hasEtf ? flow.sum : null,
			etfApplicable: hasEtf,
			datApplicable: dat.length > 0,
			datQty: dat.reduce((a, h) => a + h.holdings, 0)
		};
	}).sort((a, b) => {
		if (sort === "d1") return (b.quote?.change24hPct ?? -999) - (a.quote?.change24hPct ?? -999);
		if (sort === "flow") return (b.flow ?? -0xde0b6b3a7640000) - (a.flow ?? -0xde0b6b3a7640000);
		return a.id.localeCompare(b.id);
	});
	function toggleCmp(id) {
		const next = cmp.includes(id) ? cmp.filter((x) => x !== id) : [...cmp, id].slice(0, 4);
		navigate({
			to: ".",
			search: (prev) => ({
				...prev,
				cmp: next.join(",")
			})
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-line bg-surface px-2",
						value: search.theme,
						onChange: (e) => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								theme: e.target.value
							})
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "테마 전체"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "메이저",
								children: "메이저"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "밈",
								children: "밈"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "인프라",
								children: "인프라"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "ETF",
								children: "ETF만 있는 심볼"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-line bg-surface px-2",
						value: search.etf,
						onChange: (e) => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								etf: e.target.value === "yes" || e.target.value === "no" ? e.target.value : "all"
							})
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "ETF 전체"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "yes",
								children: "ETF 있음"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "no",
								children: "ETF 없음"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-line bg-surface px-2",
						value: search.dat,
						onChange: (e) => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								dat: e.target.value === "yes" || e.target.value === "no" ? e.target.value : "all"
							})
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "기업보유 전체"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "yes",
								children: "트레저리 보유"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "no",
								children: "트레저리 없음"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-line bg-surface px-2",
						value: search.venue,
						onChange: (e) => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								venue: e.target.value
							})
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "거래소 전체"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "upbit",
								children: "업비트 KRW"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "perp",
								children: "USDT-M 선물"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-9 rounded-md border border-line px-3",
						onClick: () => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								watch: p.watch === "1" ? "0" : "1"
							})
						}),
						children: search.watch === "1" ? "관심만 보는 중" : "관심만"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-line bg-surface px-2",
						value: sort,
						onChange: (e) => setSort(e.target.value === "d1" || e.target.value === "flow" ? e.target.value : "sym"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "sym",
								children: "심볼"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "d1",
								children: "24h"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "flow",
								children: "ETF 5세션"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "코인",
				aside: `${rows.length}개 · ETF/기업 공백은 N/A`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[760px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-1 font-medium",
									children: "비교"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "font-medium",
									children: "코인"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "font-medium",
									children: "가격"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "font-medium",
									children: "24h"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "font-medium",
									children: "7d"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "font-medium",
									children: "ETF 5세션"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "font-medium",
									children: "트레저리 합성"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "font-medium",
									children: "장소"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => {
							const asset = desk.assets.find((a) => a.id === row.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-9 rounded-md border border-line px-2 text-xs",
											onClick: () => toggleCmp(row.id),
											children: cmp.includes(row.id) ? "빼기" : "비교"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetLink, {
										id: row.id,
										search,
										symbol: asset.symbol,
										name: asset.nameKo
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "font-mono tabular-nums",
										children: row.quote?.priceUsd == null ? "—" : row.quote.priceUsd.toLocaleString("en-US", { maximumFractionDigits: row.quote.priceUsd < 1 ? 8 : 2 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: row.quote?.change24hPct }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: row.quote?.change7dPct }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										n: row.flow,
										applicable: row.etfApplicable
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.datApplicable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-sm tabular-nums",
										children: row.datQty.toLocaleString("en-US", { maximumFractionDigits: 0 })
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "N/A"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "text-xs text-muted",
										children: [row.quote?.venue ?? "—", row.quote?.upbitKrw ? " · KRW" : ""]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, { assetId: row.id }) })
								]
							}, row.id);
						}) })]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted",
					children: "트레저리 합은 회사별 최신 공개의 합성입니다. 같은 시각 잔고가 아닙니다. ETF 5세션은 결측이 있으면 — 입니다."
				})]
			}),
			cmp.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "비교",
				aside: "같은 단위, 최대 4개",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-1 font-medium",
								children: "항목"
							}), cmp.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "font-mono",
								children: id.toUpperCase()
							}, id))] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2",
									children: "24h"
								}), cmp.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quoteOf(desk, id)?.change24hPct }) }, id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2",
									children: "7d"
								}), cmp.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quoteOf(desk, id)?.change7dPct }) }, id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2",
									children: "ETF 최근 세션"
								}), cmp.map((id) => {
									const applicable = desk.etf.products.some((p) => p.assetId === id);
									const last = desk.etf.sessions.find((s) => s.assetId === id);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										n: last?.netFlowUsd ?? null,
										applicable
									}) }, id);
								})]
							})
						] })]
					})
				})
			}) : null
		]
	});
}
//#endregion
export { Coins as component };
