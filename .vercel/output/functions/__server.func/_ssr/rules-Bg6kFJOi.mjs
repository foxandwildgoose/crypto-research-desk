import { i as fmtPct, s as fmtUsd } from "./format-Du1nKKBb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rules-Bg6kFJOi.js
var RULE_VERSION = {
	etf: "etf-strength-v1",
	dat: "dat-action-v1",
	catalyst: "catalyst-v1",
	meme: "meme-attention-v1"
};
function sessionWindow(sessions, start, count) {
	const slice = sessions.slice(start, start + count);
	if (slice.length < count) return {
		sum: null,
		partial: true,
		dates: slice.map((s) => s.date)
	};
	if (slice.some((s) => s.partial || s.netFlowUsd == null)) return {
		sum: null,
		partial: true,
		dates: slice.map((s) => s.date)
	};
	return {
		sum: slice.reduce((a, s) => a + (s.netFlowUsd ?? 0), 0),
		partial: false,
		dates: slice.map((s) => s.date)
	};
}
function etfStrength(sessions) {
	const latest = sessionWindow(sessions, 0, 5);
	const prior = sessionWindow(sessions, 5, 5);
	if (latest.sum == null || prior.sum == null) return {
		hit: false,
		why: `${RULE_VERSION.etf} 미충족. 최근 5세션 또는 이전 5세션이 비거나 결측이라 합계를 만들지 않음. 휴장일은 0으로 채우지 않음.`
	};
	const hit = latest.sum > 0 && latest.sum > prior.sum;
	return {
		hit,
		why: `${RULE_VERSION.etf}: 최근 5세션 ${fmtUsd(latest.sum)} (${latest.dates[latest.dates.length - 1]}–${latest.dates[0]}), 이전 5세션 ${fmtUsd(prior.sum)}. ${hit ? "양수이며 직전 구간보다 큼." : "강화 조건(양수이면서 직전 구간 초과) 아님."} 순창출·환매 기준. 거래대금이나 AUM 변화는 유입이 아님.`
	};
}
function reconcilePair(companyId, assetId, beginQty, beginAsOf, endQty, endAsOf, buys, sales, rewards, sourceUrl) {
	const residual = endQty - (beginQty + buys - sales + rewards);
	return {
		companyId,
		assetId,
		beginQty,
		beginAsOf,
		endQty,
		endAsOf,
		buys,
		sales,
		rewards,
		adjustments: 0,
		residual,
		note: residual === 0 ? "기초 + 매수 − 매도 + 보상 = 기말. 잔차 0." : `잔차 ${residual.toLocaleString("en-US")}. 미설명 차이를 0으로 덮지 않음.`,
		sourceUrl
	};
}
function buildReconciliations(disclosures) {
	const groups = /* @__PURE__ */ new Map();
	for (const d of disclosures) {
		const key = `${d.companyId}:${d.assetId}`;
		const list = groups.get(key) ?? [];
		list.push(d);
		groups.set(key, list);
	}
	const out = [];
	for (const [key, list] of groups) {
		const [companyId, assetId] = key.split(":");
		const balances = list.filter((d) => d.endingQty != null && d.classification === "balance").sort((a, b) => a.asOf < b.asOf ? -1 : 1);
		if (balances.length < 2) continue;
		const begin = balances[balances.length - 2];
		const end = balances[balances.length - 1];
		const buys = list.filter((d) => d.classification === "purchase" && d.acquiredQty != null && d.asOf > begin.asOf && d.asOf <= end.asOf).reduce((a, d) => a + (d.acquiredQty ?? 0), 0);
		const sales = list.filter((d) => d.classification === "sale" && d.asOf > begin.asOf && d.asOf <= end.asOf).reduce((a, d) => a + (d.soldQty ?? 0), 0);
		out.push(reconcilePair(companyId, assetId, begin.endingQty ?? 0, begin.asOf, end.endingQty ?? 0, end.asOf, buys, sales, 0, end.sourceUrl));
	}
	return out;
}
function priceReaction(candles, eventIso) {
	if (!candles.length) return {
		since: null,
		pre: null,
		note: "일봉이 없어 반응을 계산하지 않음."
	};
	const event = new Date(eventIso).getTime();
	const sorted = [...candles].sort((a, b) => a.t - b.t);
	const after = sorted.find((c) => c.t >= event) ?? sorted[sorted.length - 1];
	const beforeIdx = sorted.findIndex((c) => c.t >= event);
	const preStart = sorted[Math.max(0, (beforeIdx < 0 ? sorted.length - 1 : beforeIdx) - 5)];
	const preEnd = sorted[Math.max(0, (beforeIdx < 0 ? sorted.length - 1 : beforeIdx) - 1)];
	const last = sorted[sorted.length - 1];
	const since = after && last && after.c ? (last.c - after.c) / after.c * 100 : null;
	const pre = preStart && preEnd && preStart.c ? (preEnd.c - preStart.c) / preStart.c * 100 : null;
	return {
		since,
		pre,
		note: `일봉 종가 기준. 발표 이후 ${fmtPct(since)}, 직전 약 5개 일봉 ${fmtPct(pre)}. 해상도가 일봉이라 장중 반응은 구분하지 못함. 미반응을 '미반영'으로 부르지 않음.`
	};
}
function memeAttention(posts, assetSymbol) {
	const related = posts.filter((p) => p.tokens.some((t) => t.replace(/^\$/, "").toUpperCase() === assetSymbol.toUpperCase()));
	const authors = [...new Set(related.map((p) => p.handle))];
	const clusters = authors.length;
	if (authors.length < 3) return {
		spike: false,
		authors,
		clusters,
		note: `${RULE_VERSION.meme}: 관측 작성자 ${authors.length}명. 서로 다른 출처 클러스터 3명과 7개 비교창 중앙값 대비 2배가 없어 급등 라벨을 붙이지 않음. 신규 언급 관찰.`
	};
	return {
		spike: false,
		authors,
		clusters,
		note: `${RULE_VERSION.meme}: 작성자는 모였으나 이전 7개 완전 창의 중앙값이 없어 급등으로 계산하지 않음.`
	};
}
function reviewHits(desk) {
	const hits = [];
	const assetIds = /* @__PURE__ */ new Set([
		...desk.etf.sessions.map((s) => s.assetId),
		...desk.dat.disclosures.map((d) => d.assetId),
		...desk.memes.map((m) => m.assetId)
	]);
	for (const assetId of assetIds) {
		const sessions = desk.etf.sessions.filter((s) => s.assetId === assetId);
		if (sessions.length) {
			const etf = etfStrength(sessions);
			if (etf.hit) hits.push({
				assetId,
				rule: RULE_VERSION.etf,
				status: "priority",
				why: etf.why,
				recency: sessions[0]?.date ?? desk.generatedAt,
				rank: 2
			});
		}
		const purchase = desk.dat.disclosures.filter((d) => d.assetId === assetId && d.classification === "purchase" && (d.acquiredQty ?? 0) > 0).sort((a, b) => a.published < b.published ? 1 : -1)[0];
		if (purchase) hits.push({
			assetId,
			rule: RULE_VERSION.dat,
			status: "priority",
			why: `${RULE_VERSION.dat}: ${purchase.excerpt}`,
			recency: purchase.published,
			rank: 2
		});
		const meme = desk.memes.find((m) => m.assetId === assetId);
		if (meme?.mention) {
			const attention = memeAttention(desk.social.posts, desk.assets.find((a) => a.id === assetId)?.symbol ?? "");
			hits.push({
				assetId,
				rule: RULE_VERSION.meme,
				status: meme.identityNote.includes("복수") ? "risk" : "watch",
				why: `${attention.note} ${meme.reason}`,
				recency: meme.firstObserved ?? desk.generatedAt,
				rank: meme.identityNote.includes("복수") ? 1 : 3
			});
		}
	}
	const filingNews = desk.news.filter((n) => n.route === "disclosure");
	for (const n of filingNews) for (const assetId of n.assetIds) {
		if (hits.some((h) => h.assetId === assetId && h.rule === RULE_VERSION.catalyst)) continue;
		hits.push({
			assetId,
			rule: RULE_VERSION.catalyst,
			status: "priority",
			why: `${RULE_VERSION.catalyst}: ${n.summaryKo}`,
			recency: n.published ?? n.firstSeen,
			rank: 2
		});
	}
	return hits.sort((a, b) => a.rank - b.rank || (a.recency < b.recency ? 1 : -1));
}
function dedupeHits(hits) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const h of hits) {
		const key = `${h.assetId}:${h.rule}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(h);
	}
	return out;
}
function evalCondition(c, quote, etf5) {
	const current = c.field === "priceUsd" ? quote?.priceUsd ?? null : c.field === "change24hPct" ? quote?.change24hPct ?? null : c.field === "funding" ? quote?.fundingRate ?? null : etf5;
	if (current == null) return {
		fired: false,
		detail: "선행 데이터 없음. 알림을 0으로 처리하지 않음."
	};
	return {
		fired: c.cmp === "gt" ? current > c.value : current < c.value,
		detail: `관측 ${current} ${c.cmp === "gt" ? ">" : "<"} ${c.value}`
	};
}
//#endregion
export { priceReaction as a, evalCondition as i, dedupeHits as n, reviewHits as o, etfStrength as r, sessionWindow as s, buildReconciliations as t };
