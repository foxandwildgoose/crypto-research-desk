import { S as useSearch, T as require_jsx_runtime, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pct, c as SaveButton, f as quoteOf, i as Panel, n as Ext, p as useDesk, r as Money, t as AssetLink } from "./desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/meme-a_oBPda6.js
var import_jsx_runtime = require_jsx_runtime();
function MemePage() {
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const navigate = useNavigate();
	const tab = search.tab === "early" || search.tab === "kol" ? search.tab : "practical";
	const practical = desk.memes.filter((m) => m.perpVenues.length > 0);
	const early = desk.memes.filter((m) => m.perpVenues.length === 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-9 rounded-md px-3 text-sm ${tab === "practical" ? "bg-accent text-accent-fg" : "border border-line"}`,
						onClick: () => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								tab: "practical"
							})
						}),
						children: "실무 후보 · 선물 있음"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-9 rounded-md px-3 text-sm ${tab === "early" ? "bg-accent text-accent-fg" : "border border-line"}`,
						onClick: () => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								tab: "early"
							})
						}),
						children: "초기 발견"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-9 rounded-md px-3 text-sm ${tab === "kol" ? "bg-accent text-accent-fg" : "border border-line"}`,
						onClick: () => void navigate({
							to: ".",
							search: (p) => ({
								...p,
								tab: "kol"
							})
						}),
						children: "계정 타임라인"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "선물 상장은 레버리지 권유가 아닙니다. 유동성은 수요의 증거가 아닙니다. @theunipcs는 시드 계정일 뿐 실력을 가정하지 않습니다."
			}),
			tab === "kol" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-3",
				children: [desk.social.posts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-md border border-line bg-surface p-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"@",
								p.handle,
								" · ",
								p.kind,
								" · ",
								p.published ?? "시각 미상",
								" ",
								p.disclosure ? `· ${p.disclosure}` : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 whitespace-pre-wrap",
							children: p.text
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: p.summaryKo
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
							href: p.url,
							children: "원문"
						})
					]
				}, p.id)), !desk.social.posts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-muted",
					children: desk.social.blockedReason ?? "게시물 없음"
				}) : null]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: tab === "practical" ? "USDT-M이 확인된 후보" : "선물 조건 없는 풀",
				aside: tab === "early" ? "정보·유동성 불확실성이 더 큼" : "기본 필터",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[840px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "토큰" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "정체" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "언급" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "24h" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "거래량" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "풀 유동성" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "장소" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "리스크" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (tab === "practical" ? practical : early).map((m) => {
							const asset = desk.assets.find((a) => a.id === m.assetId);
							const quote = quoteOf(desk, m.assetId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line align-top",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: asset ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetLink, {
											id: asset.id,
											search,
											symbol: asset.symbol,
											name: asset.nameKo
										}) : m.assetId
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "max-w-40 text-xs",
										children: m.identityNote
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "text-xs",
										children: [
											m.mention ?? "표본에 없음",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
											m.attentionNote
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quote?.change24hPct }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: m.volume24hUsd }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-xs",
										children: m.liquidityUsd == null ? "—" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [m.liquidityKind === "dex-pool" ? "DEX 풀 " : "호가 거래대금 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: m.liquidityUsd })] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "text-xs",
										children: [[...m.spotVenues, ...m.perpVenues].join(" · ") || "—", m.krwListed ? " · KRW" : " · KRW 목록 없음"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "max-w-xs text-xs",
										children: m.risk
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, { assetId: m.assetId }) })
								]
							}, m.assetId);
						}) })]
					})
				})
			})
		]
	});
}
//#endregion
export { MemePage as component };
