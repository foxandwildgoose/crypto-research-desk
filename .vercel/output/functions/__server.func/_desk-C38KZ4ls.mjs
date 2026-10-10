import { s as fmtUsd } from "./_ssr/format-Du1nKKBb.mjs";
import { n as dedupeHits, o as reviewHits, r as etfStrength } from "./_ssr/rules-Bg6kFJOi.mjs";
import { S as useSearch, T as require_jsx_runtime, b as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as useWatch } from "./_ssr/watch-store-DK3fR7jm.mjs";
import { a as Pct, c as SaveButton, d as assetOf, f as quoteOf, i as Panel, l as StatusText, o as Px, p as useDesk, r as Money, t as AssetLink, u as When } from "./_ssr/desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_desk-C38KZ4ls.js
var import_jsx_runtime = require_jsx_runtime();
var RANK = {
	risk: 0,
	priority: 1,
	watch: 2,
	waiting: 3,
	gap: 4
};
function Home() {
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const rows = useWatch((s) => s.rows);
	const hits = dedupeHits(reviewHits(desk));
	const grouped = /* @__PURE__ */ new Map();
	for (const hit of hits) {
		const list = grouped.get(hit.assetId) ?? [];
		list.push(hit);
		grouped.set(hit.assetId, list);
	}
	const candidates = [...grouped.entries()].map(([assetId, list]) => {
		return {
			assetId,
			status: list.map((h) => h.status).sort((a, b) => RANK[a] - RANK[b])[0],
			why: list.map((h) => h.why).join(" "),
			recency: list[0]?.recency ?? desk.generatedAt
		};
	}).sort((a, b) => RANK[a.status] - RANK[b.status] || (a.recency < b.recency ? 1 : -1)).slice(0, 10);
	const savedOnly = rows.filter((r) => !grouped.has(r.assetId));
	const majors = [
		"btc",
		"eth",
		"sol"
	].map((id) => quoteOf(desk, id)).filter((q) => q);
	const flowAssets = [...new Set(desk.etf.sessions.map((s) => s.assetId))];
	const catalysts = [...desk.news.filter((n) => n.route === "disclosure"), ...desk.news.filter((n) => n.route === "news")].slice(0, 6);
	const memeMoves = desk.memes.filter((m) => m.mention || m.perpVenues.length).slice(0, 5);
	const warns = desk.warnings.filter((w) => w.level === "warn");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex max-w-full gap-2 overflow-x-auto",
				children: majors.map((q) => q ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/coins/$assetId",
					params: { assetId: q.assetId },
					search,
					className: "min-w-44 rounded-md border border-line bg-surface px-3 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								q.assetId.toUpperCase(),
								" · ",
								q.venue
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-lg tabular-nums",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Px, { n: q.priceUsd })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: q.change24hPct }),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: "24h"
							})
						] }),
						q.fundingRate != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"펀딩 ",
								(q.fundingRate * 100).toFixed(4),
								"%"
							]
						}) : null,
						q.premiumPct != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							title: q.premiumNote,
							children: ["김프 참고 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: q.premiumPct })]
						}) : null
					]
				}, q.assetId) : null)
			}),
			warns.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border border-warn px-3 py-2 text-sm text-warn",
				children: warns.map((w) => w.message).join(" ")
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "검토 후보",
						aside: "규칙이 걸린 자산만. 채우기용 후보는 없음.",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full min-w-[640px] text-left text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "text-xs text-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-1 font-medium",
											children: "코인"
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
											children: "왜 지금"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "font-medium",
											children: "상태"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [candidates.map((row) => {
									const asset = assetOf(desk, row.assetId);
									const quote = quoteOf(desk, row.assetId);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-t border-line align-top",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2 pr-2",
												children: asset ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetLink, {
													id: asset.id,
													search,
													symbol: asset.symbol,
													name: asset.nameKo
												}) : row.assetId
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "pr-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quote?.change24hPct })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "pr-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quote?.change7dPct })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "max-w-sm pr-2 text-xs leading-5",
												children: row.why
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "pr-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusText, { status: row.status })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, { assetId: row.assetId }) })
										]
									}, row.assetId);
								}), !candidates.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 6,
									className: "py-4 text-muted",
									children: "오늘은 규칙에 걸린 후보가 없습니다. 저장된 관심은 아래에 따로 있습니다."
								}) }) : null] })]
							})
						}), savedOnly.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 border-t border-line pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 text-xs text-muted",
								children: "저장만 된 자산. 새 규칙 없음."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "flex flex-wrap gap-2",
								children: savedOnly.map((row) => {
									const asset = assetOf(desk, row.assetId);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/coins/$assetId",
										params: { assetId: row.assetId },
										search,
										className: "rounded-md bg-chip px-2 py-1 text-sm",
										children: asset?.symbol ?? row.assetId
									}) }, row.assetId);
								})
							})]
						}) : null]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "새 자료",
					aside: "공시와 헤드라인",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-3",
						children: catalysts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "border-b border-line pb-2 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: item.summaryKo || item.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted",
									children: [
										item.source,
										" · ",
										item.route === "disclosure" ? "공시" : "기사",
										" · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(When, { iso: item.published ?? item.firstSeen })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/intel",
									search,
									className: "text-xs text-accent",
									children: "원문 맥락"
								})
							]
						}, item.id))
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "ETF 순유입 변화",
					aside: "최근 5거래일 vs 이전 5거래일",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 text-sm",
						children: flowAssets.map((id) => {
							const sessions = desk.etf.sessions.filter((s) => s.assetId === id);
							const rule = etfStrength(sessions);
							const last = sessions[0];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "border-b border-line pb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/etf",
										search: {
											...search,
											q: id
										},
										className: "font-mono",
										children: id.toUpperCase()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: last?.netFlowUsd ?? null })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-5 text-muted",
									children: rule.why
								})]
							}, id);
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "밈 주목",
					aside: "급등 라벨은 기준선이 있을 때만",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 text-sm",
						children: memeMoves.map((m) => {
							const asset = assetOf(desk, m.assetId);
							const quote = quoteOf(desk, m.assetId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "border-b border-line pb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetLink, {
										id: m.assetId,
										search,
										symbol: asset?.symbol ?? m.assetId,
										name: asset?.nameKo ?? ""
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quote?.change24hPct })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted",
									children: [
										m.attentionNote,
										" ",
										m.perpVenues.join(", ") || "선물 없음",
										" · 거래량 ",
										fmtUsd(m.volume24hUsd)
									]
								})]
							}, m.assetId);
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"기준 ",
						desk.generatedAt.slice(0, 16),
						"Z · 화면은 서울"
					] }),
					desk.modules.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						m.label,
						" ",
						m.state === "live" ? "실시간" : m.state === "snapshot" ? "스냅샷" : m.state === "partial" ? "부분" : "실패"
					] }, m.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: desk.warnings.find((w) => w.scope === "market")?.message })
				]
			})
		]
	});
}
//#endregion
export { Home as component };
