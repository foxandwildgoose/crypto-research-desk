import { r as etfStrength, s as sessionWindow } from "./rules-Bg6kFJOi.mjs";
import { S as useSearch, T as require_jsx_runtime, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as FlowChart } from "./charts-BedTQwVx.mjs";
import { i as Panel, n as Ext, p as useDesk, r as Money } from "./desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/etf-Dtyux8u6.js
var import_jsx_runtime = require_jsx_runtime();
function EtfPage() {
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const navigate = useNavigate();
	const tab = search.tab === "products" || search.tab === "calendar" ? search.tab : "flows";
	const assets = [...new Set(desk.etf.products.map((p) => p.assetId))];
	const focus = assets.includes(search.q.toLowerCase()) ? search.q.toLowerCase() : assets[0];
	const sessions = desk.etf.sessions.filter((s) => s.assetId === focus);
	const products = desk.etf.products.filter((s) => !search.q || s.assetId.includes(search.q.toLowerCase()) || s.ticker.toLowerCase().includes(search.q.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [[
					"flows",
					"products",
					"calendar"
				].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `h-9 rounded-md px-3 text-sm ${tab === id ? "bg-accent text-accent-fg" : "border border-line"}`,
					onClick: () => void navigate({
						to: ".",
						search: (p) => ({
							...p,
							tab: id
						})
					}),
					children: id === "flows" ? "자금" : id === "products" ? "상품" : "일정"
				}, id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "self-center text-xs text-muted",
					children: desk.etf.coverageNote
				})]
			}),
			tab === "flows" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2",
					children: assets.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-9 rounded-md px-3 font-mono text-sm ${focus === id ? "bg-chip" : "border border-line"}`,
						onClick: () => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								q: id
							})
						}),
						children: id.toUpperCase()
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: `${focus?.toUpperCase() ?? ""} 순유입`,
					aside: desk.etf.provenance.note,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowChart, { rows: [...sessions].reverse().filter((s) => s.netFlowUsd != null).map((s) => ({
							day: s.date,
							flow: s.netFlowUsd ?? 0
						})) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: sessions.length ? etfStrength(sessions).why : "세션 없음"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"5세션 ",
								labelSum(sessionWindow(sessions, 0, 5).sum),
								" · 20세션 ",
								labelSum(sessionWindow(sessions, 0, 20).sum),
								" · 휴장일은 행이 없어 0이 아님"
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-md border border-line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[720px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-2 py-1",
									children: "날짜"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "순유입" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "거래대금" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "순자산" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "누적" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "+/−/0" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "결측" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sessions.slice(0, 24).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-1 font-mono",
									children: s.date
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: s.netFlowUsd }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: s.valueTradedUsd }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: s.netAssetsUsd }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: s.cumFlowUsd }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "font-mono text-xs",
									children: [
										s.positiveIssuers ?? "—",
										"/",
										s.negativeIssuers ?? "—",
										"/",
										s.flatIssuers ?? "—"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-xs",
									children: s.partial ? s.missingTickers.join(", ") || "부분" : "보고분 완전"
								})
							]
						}, s.date)) })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heat, { deskAsset: focus }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer",
						children: "펀드별 최근 세션"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1",
						children: desk.etf.products.filter((p) => p.assetId === focus).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-3 border-b border-line py-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono",
									children: p.ticker
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.issuer }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
									n: p.dailyFlowUsd,
									applicable: p.dailyFlowUsd != null
								})
							]
						}, p.ticker))
					})]
				})
			] }) : null,
			tab === "products" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-md border border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[760px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-xs text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-1",
								children: "자산"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "티커" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "발행사" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "지역" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "유형" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "상태" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "AUM" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "출처" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-2 py-1 font-mono",
								children: p.assetId.toUpperCase()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: p.ticker
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: p.issuer }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: p.jurisdiction }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: p.exposure === "spot" ? "현물" : "미분류" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: p.tradingState === "reported" ? "숫자 있음" : "행만 있음" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: p.aumUsd }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
								href: p.sourceUrl,
								children: "페이지"
							}) })
						]
					}, p.assetId + p.ticker)) })]
				})
			}) : null,
			tab === "calendar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-3",
				children: desk.etf.milestones.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-md border border-line bg-surface p-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: m.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								m.date ?? "날짜 미확인",
								" · ",
								m.uncertainty
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: m.summary }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
							href: m.url,
							children: "근거"
						})
					]
				}, m.id))
			}) : null
		]
	});
}
function Heat({ deskAsset }) {
	const desk = useDesk();
	if (!deskAsset) return null;
	const cells = desk.etf.heat.filter((h) => h.assetId === deskAsset);
	const dates = [...new Set(cells.map((c) => c.date))].sort();
	const tickers = [...new Set(cells.map((c) => c.ticker))];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "코인×세션",
		aside: "단위 백만 달러. 빈 칸은 결측.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "text-left text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "px-1 py-1",
					children: "티커"
				}), dates.slice(-12).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "px-1 font-mono",
					children: d.slice(5)
				}, d))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: tickers.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 pr-2 font-mono",
					children: t
				}), dates.slice(-12).map((d) => {
					const v = cells.find((c) => c.ticker === t && c.date === d)?.flowUsd;
					const m = v == null ? null : v / 1e6;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: `px-1 font-mono tabular-nums ${m == null ? "text-muted" : m > 0 ? "text-up" : m < 0 ? "text-down" : ""}`,
						children: m == null ? "—" : m.toFixed(1)
					}, d);
				})] }, t)) })]
			})
		})
	});
}
function labelSum(n) {
	if (n == null) return "합산 안 함";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0
	}).format(n);
}
//#endregion
export { EtfPage as component };
