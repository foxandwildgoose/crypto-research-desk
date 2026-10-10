import { i as __toESM } from "./_runtime.mjs";
import { i as fmtPct, m as seoulDate } from "./_ssr/format-Du1nKKBb.mjs";
import { a as priceReaction, r as etfStrength, s as sessionWindow } from "./_ssr/rules-Bg6kFJOi.mjs";
import { Q as require_react, S as useSearch, T as require_jsx_runtime, b as Link, x as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { r as Route$2 } from "./_ssr/router-CqXd9UYe.mjs";
import { t as useWatch } from "./_ssr/watch-store-DK3fR7jm.mjs";
import { n as PriceChart, r as StepChart, t as FlowChart } from "./_ssr/charts-BedTQwVx.mjs";
import { a as Pct, c as SaveButton, i as Panel, n as Ext, o as Px, p as useDesk, r as Money, s as Qty, u as When } from "./_ssr/desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_assetId-BOxiKXnP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	"etf",
	"dat",
	"market",
	"meme",
	"news",
	"notes"
];
function CoinPage() {
	const { assetId } = Route$2.useParams();
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const navigate = useNavigate();
	const asset = desk.assets.find((a) => a.id === assetId);
	const quote = desk.quotes.find((q) => q.assetId === assetId);
	const tab = TABS.includes(search.tab) ? search.tab : "etf";
	const sessions = desk.etf.sessions.filter((s) => s.assetId === assetId);
	const products = desk.etf.products.filter((p) => p.assetId === assetId);
	const holdings = desk.dat.holdings.filter((h) => h.assetId === assetId);
	const discs = desk.dat.disclosures.filter((d) => d.assetId === assetId);
	const news = desk.news.filter((n) => n.assetIds.includes(assetId) || n.title.toUpperCase().includes(asset?.symbol ?? "___"));
	const meme = desk.memes.find((m) => m.assetId === assetId);
	const posts = desk.social.posts.filter((p) => p.tokens.some((t) => t.replace(/^\$/, "").toUpperCase() === asset?.symbol));
	const candles = (desk.candles[assetId] ?? []).slice(-(search.w === "7" ? 8 : search.w === "90" ? 40 : 31));
	const etf = products.length ? etfStrength(sessions) : null;
	const five = sessionWindow(sessions, 0, 5);
	const latestDisc = discs.find((d) => d.classification === "purchase") ?? discs[0];
	const reaction = latestDisc ? priceReaction(desk.candles[assetId] ?? [], latestDisc.asOf) : null;
	const btc = assetId === "btc" ? null : relToBtc(candles, desk.candles.btc ?? []);
	const horizon = search.h === "s" ? "전략 구간에서는 5세션보다 누적 순유입과 공급 비중을 먼저 봅니다." : "전술 구간에서는 최근 5거래일 순유입과 공시 매수를 먼저 봅니다.";
	const row = useWatch((s) => s.rows.find((r) => r.assetId === assetId));
	const patch = useWatch((s) => s.patch);
	const addCondition = useWatch((s) => s.addCondition);
	const [field, setField] = (0, import_react.useState)("change24hPct");
	const [cmp, setCmp] = (0, import_react.useState)("gt");
	const [value, setValue] = (0, import_react.useState)("0");
	if (!asset) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm",
		children: "이 심볼은 현재 수집 목록에 없습니다."
	});
	const balances = discs.filter((d) => d.endingQty != null).sort((a, b) => a.asOf < b.asOf ? -1 : 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							asset.themes.join(" · ") || "미분류",
							" · ",
							asset.identity === "verified" ? "컨트랙트 대조" : asset.identity === "native" ? "네이티브" : "정체 미확정"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "text-2xl font-semibold",
						children: [
							asset.nameKo,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono",
								children: asset.symbol
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							quote?.venue ?? "시세 없음",
							" · ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(When, { iso: quote?.asOf })
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-2xl tabular-nums",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Px, { n: quote?.priceUsd ?? null })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quote?.change24hPct }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "24h"
						}),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quote?.change7dPct }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "7d"
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, { assetId }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-9 rounded-md border border-line px-3 text-sm",
						onClick: () => void navigate({
							to: "/coins",
							search: {
								...search,
								cmp: [search.cmp, assetId].filter(Boolean).join(",")
							}
						}),
						children: "비교에 넣기"
					}),
					quote?.sourceUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "inline-flex h-9 items-center text-sm text-accent",
						href: quote.sourceUrl,
						target: "_blank",
						rel: "noreferrer",
						children: "시세 출처"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-2 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "가격",
						aside: "OKX 일봉. ETF와 축을 섞지 않음.",
						children: [candles.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriceChart, { candles }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "일봉이 없습니다."
						}), btc != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted",
							children: [
								"같은 일봉 수 기준 BTC 대비 ",
								fmtPct(btc),
								". 상관의 증거가 아닙니다."
							]
						}) : null]
					}), products.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "ETF 일별 순유입",
						aside: sessions[0] ? `최근 세션 ${sessions[0].date}` : "",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowChart, { rows: [...sessions].reverse().filter((s) => s.netFlowUsd != null).slice(-(search.w === "7" ? 7 : 30)).map((s) => ({
							day: s.date,
							flow: s.netFlowUsd
						})) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "결측 세션은 차트에서 0으로 보이지 않게 빼고, 합계 규칙에서도 제외합니다. 여기 슬라이스는 값이 있는 세션만입니다."
						})]
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "짧은 논지",
					aside: search.h === "s" ? "전략" : "전술",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-sm leading-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "관찰" }),
								" ",
								etf ? etf.why : "이 자산의 ETF 순유입 표는 없음.",
								" ",
								latestDisc ? latestDisc.excerpt : ""
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "수요로 이어질 수 있는 경로" }), " ETF 순창출은 즉시 비헤지 현물 매수를 증명하지 않습니다. 기업 매수는 공시 기간의 집행이지 매일의 체결이 아닙니다."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "다른 설명" }), " 가격은 펀딩, 선물 포지션, 거시 금리, 이 표에 없는 채굴 매도로도 움직입니다."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "가격 반응" }),
								" ",
								reaction ? `${reaction.note} 이후 ${fmtPct(reaction.since)}, 이전 ${fmtPct(reaction.pre)}.` : "연결할 공시 시각이 없습니다."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "다음 확인" }),
								" ",
								horizon
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "무효화" }),
								" ",
								row?.invalidation || "관심 메모의 무효 조건이 비어 있습니다. 알림 조건과는 별개입니다."
							] })
						]
					}), quote?.contractMultiplier != null && quote.perpAvailable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted",
						children: [
							"USDT-M 계약면 ",
							quote.contractMultiplier,
							" ",
							asset.symbol,
							". 현물 가격을 이 숫자로 나누지 않습니다."
						]
					}) : null]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1",
				children: TABS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `h-9 rounded-md px-3 text-sm ${tab === id ? "bg-accent text-accent-fg" : "border border-line"}`,
					onClick: () => void navigate({
						to: ".",
						search: (p) => ({
							...p,
							tab: id
						})
					}),
					children: {
						etf: "ETF",
						dat: "기업",
						market: "시장",
						meme: "밈",
						news: "뉴스",
						notes: "메모"
					}[id]
				}, id))
			}),
			tab === "etf" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "ETF",
				aside: products.length ? "해당 있음" : "N/A",
				children: [
					!products.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "이 자산의 미국 현물 ETF 행이 출처 페이지에 없습니다. 0 유입으로 두지 않습니다."
					}) : null,
					products.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-2 text-xs text-muted",
						children: ["5세션 ", five.sum == null ? "결측으로 합산 안 함" : fmtUsdSafe(five.sum)]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[640px] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "text-xs text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "티커" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "발행사" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "일일 순유입" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "AUM" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "누적" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "수수료" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-1 font-mono",
										children: p.ticker
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: p.issuer }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										n: p.dailyFlowUsd,
										applicable: p.tradingState === "reported" || p.dailyFlowUsd != null
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: p.aumUsd }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: p.cumulativeFlowUsd }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "font-mono",
										children: p.feePct == null ? "—" : `${p.feePct}%`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
										href: p.sourceUrl,
										children: "출처"
									}) })
								]
							}, p.ticker)) })]
						})
					})
				]
			}) : null,
			tab === "dat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "기업 보유",
				aside: "디렉터리와 SEC를 합치지 않음",
				children: [
					!holdings.length && !discs.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "N/A. 트레저리 디렉터리와 SEC 파싱 모두 이 자산 행이 없습니다."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[680px] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "text-xs text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "회사" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "분류" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "수량" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "공급 비중" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "출처" })
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: holdings.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/dat/$companyId",
											params: { companyId: h.companyId },
											search,
											className: "hover:text-accent",
											children: h.name
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: h.kind }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qty, { n: h.holdings }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "font-mono",
										children: h.supplySharePct == null ? "—" : `${h.supplySharePct.toFixed(3)}%`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-xs",
										children: "CoinGecko. 일자 없음"
									})
								]
							}, h.companyId + h.ticker)) })]
						})
					}),
					balances.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepChart, { rows: balances.map((d) => ({
						day: d.asOf.slice(0, 10),
						qty: d.endingQty ?? 0
					})) }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-2 text-sm",
						children: discs.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
								href: d.sourceUrl,
								children: seoulDate(d.asOf.slice(0, 10))
							}),
							" ",
							d.excerpt
						] }, d.id))
					})
				]
			}) : null,
			tab === "market" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "시장",
				aside: quote?.premiumNote,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-1 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["거래대금(24h) ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { n: quote?.volume24hUsd ?? null })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["시가총액 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							n: quote?.marketCapUsd ?? null,
							applicable: quote?.marketCapUsd != null
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["업비트 KRW ", quote?.upbitKrw ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qty, { n: quote.krwPrice }) : "상장 목록에 없음"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							"참고 프리미엄 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pct, { n: quote?.premiumPct }),
							". 동시호가 아님."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							"펀딩 ",
							quote?.fundingRate == null ? "—" : `${(quote.fundingRate * 100).toFixed(4)}%`,
							" ",
							quote?.fundingTime ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(When, { iso: quote.fundingTime }) : null
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["미결제약정 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							n: quote?.openInterestUsd ?? null,
							applicable: quote?.openInterestUsd != null
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["선물 ", quote?.perpAvailable ? "OKX USDT-M 있음. 거래 권유 아님." : "확인된 USDT-M 없음"] }),
						asset.contract ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							"컨트랙트 ",
							asset.contract.chain,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: asset.contract.address
							}),
							". ",
							asset.contract.note
						] }) : null
					]
				})
			}) : null,
			tab === "meme" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "밈·소셜",
				children: [meme ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-6",
					children: [
						meme.reason,
						" ",
						meme.risk,
						" ",
						meme.attentionNote,
						" 정체: ",
						meme.identityNote
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "밈 후보 풀에 없는 자산입니다."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-2 space-y-2 text-sm",
					children: [posts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Ext, {
							href: p.url,
							children: ["@", p.handle]
						}),
						" ",
						p.summaryKo,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs",
							children: p.text
						})
					] }, p.id)), !posts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "이 심볼을 가리키는 저장 게시물이 없습니다."
					}) : null]
				})]
			}) : null,
			tab === "news" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "뉴스·촉매",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm",
					children: [news.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ext, {
						href: n.url,
						children: n.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							n.summaryKo,
							" ",
							n.counter
						]
					})] }, n.id)), !news.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "연결 헤드라인 없음. 자료 없음이지 사건 없음이 아닙니다."
					}) : null]
				})
			}) : null,
			tab === "notes" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "메모와 조건",
				aside: "이 브라우저에만 저장",
				children: [
					!row ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-sm text-muted",
						children: "관심을 저장하면 메모와 조건을 남길 수 있습니다."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["무효화 메모 (알림 조건 아님)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "mt-1 w-full rounded-md border border-line bg-bg p-2",
							rows: 3,
							value: row?.invalidation ?? "",
							onChange: (e) => row && patch(assetId, { invalidation: e.target.value.slice(0, 2e3) })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-2 block text-sm",
						children: ["연구 노트", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "mt-1 w-full rounded-md border border-line bg-bg p-2",
							rows: 3,
							value: row?.note ?? "",
							onChange: (e) => row && patch(assetId, { note: e.target.value.slice(0, 2e3) })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex flex-wrap items-end gap-2 text-sm",
						onSubmit: (e) => {
							e.preventDefault();
							const n = Number(value);
							if (!Number.isFinite(n)) return;
							addCondition(assetId, {
								id: `${field}-${cmp}-${n}`,
								assetId,
								field,
								cmp,
								value: n,
								note: "화면이 열려 있을 때만 평가"
							});
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-9 rounded-md border border-line bg-surface px-2",
								value: field,
								onChange: (e) => setField(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "change24hPct",
										children: "24h %"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "priceUsd",
										children: "가격 USD"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "etf5",
										children: "ETF 5세션 USD"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "funding",
										children: "펀딩"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-9 rounded-md border border-line bg-surface px-2",
								value: cmp,
								onChange: (e) => setCmp(e.target.value === "lt" ? "lt" : "gt"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "gt",
									children: "초과"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "lt",
									children: "미만"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "h-9 w-28 rounded-md border border-line bg-bg px-2",
								value,
								onChange: (e) => setValue(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "h-9 rounded-md bg-accent px-3 text-accent-fg",
								type: "submit",
								children: "조건 만들기"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 text-sm",
						children: (row?.conditions ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "font-mono text-xs",
							children: [
								c.field,
								" ",
								c.cmp,
								" ",
								c.value
							]
						}, c.id))
					})
				]
			}) : null
		]
	});
}
function relToBtc(asset, btc) {
	if (asset.length < 2 || btc.length < 2) return null;
	const a0 = asset[0];
	const a1 = asset[asset.length - 1];
	const b0 = btc.find((c) => Math.abs(c.t - a0.t) < 36e5) ?? btc[0];
	const b1 = btc[btc.length - 1];
	if (!a0.c || !b0.c) return null;
	return (a1.c / a0.c - 1 - (b1.c / b0.c - 1)) * 100;
}
function fmtUsdSafe(n) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0
	}).format(n);
}
//#endregion
export { CoinPage as component };
