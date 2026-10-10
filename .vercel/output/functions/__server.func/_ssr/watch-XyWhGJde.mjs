import { p as seoul, t as csvCell } from "./format-Du1nKKBb.mjs";
import { i as evalCondition, s as sessionWindow } from "./rules-Bg6kFJOi.mjs";
import { S as useSearch, T as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as object, i as number, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
import { i as STATUS_KO } from "./router-CqXd9UYe.mjs";
import { t as useWatch } from "./watch-store-DK3fR7jm.mjs";
import { c as SaveButton, f as quoteOf, i as Panel, p as useDesk, t as AssetLink } from "./desk-ui-D-_9VvRt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watch-XyWhGJde.js
var import_jsx_runtime = require_jsx_runtime();
var ImportRow = object({
	assetId: string().max(40),
	savedAt: string().max(40),
	status: _enum([
		"priority",
		"watch",
		"waiting",
		"risk",
		"gap"
	]),
	note: string().max(2e3),
	invalidation: string().max(2e3),
	snoozeUntil: string().max(40).nullable(),
	seenAt: string().max(40).nullable(),
	conditions: array(object({
		id: string().max(80),
		assetId: string().max(40),
		field: _enum([
			"priceUsd",
			"change24hPct",
			"etf5",
			"funding"
		]),
		cmp: _enum(["gt", "lt"]),
		value: number(),
		note: string().max(500)
	})).max(20)
});
function WatchPage() {
	const desk = useDesk();
	const search = useSearch({ from: "/_desk" });
	const rows = useWatch((s) => s.rows);
	const patch = useWatch((s) => s.patch);
	const removeCondition = useWatch((s) => s.removeCondition);
	const replaceAll = useWatch((s) => s.replaceAll);
	function exportCsv() {
		const header = [
			"asset",
			"status",
			"note",
			"invalidation"
		].map(csvCell).join(",");
		const body = rows.map((r) => [
			r.assetId,
			r.status,
			r.note,
			r.invalidation
		].map(csvCell).join(",")).join("\n");
		const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "investpan-watch.csv";
		a.click();
		URL.revokeObjectURL(url);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "알림은 이 화면이 열려 데이터를 읽은 순간에만 계산됩니다. 백그라운드 워커는 없습니다."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-9 rounded-md border border-line px-3 text-sm",
					onClick: exportCsv,
					children: "CSV 보내기"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex h-9 items-center rounded-md border border-line px-3 text-sm",
					children: ["JSON 가져오기", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "file",
						accept: "application/json",
						className: "sr-only",
						onChange: async (e) => {
							const file = e.target.files?.[0];
							if (!file) return;
							const text = await file.text();
							try {
								const parsed = ImportRow.array().max(200).safeParse(JSON.parse(text));
								if (!parsed.success) return;
								replaceAll(parsed.data);
							} catch {
								return;
							}
						}
					})]
				})]
			}),
			!rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "저장된 관심 없음."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-3",
				children: rows.map((row) => {
					const asset = desk.assets.find((a) => a.id === row.assetId);
					const quote = quoteOf(desk, row.assetId);
					const etf5 = sessionWindow(desk.etf.sessions.filter((s) => s.assetId === row.assetId), 0, 5).sum;
					const snoozed = row.snoozeUntil != null && Date.parse(row.snoozeUntil) > Date.now();
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: asset ? `${asset.symbol} ${asset.nameKo}` : row.assetId,
						aside: seoul(row.savedAt),
						children: [
							asset ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetLink, {
								id: asset.id,
								search,
								symbol: asset.symbol,
								name: asset.nameKo
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										className: "h-9 rounded-md border border-line bg-bg px-2 text-sm",
										value: row.status,
										onChange: (e) => patch(row.assetId, { status: e.target.value }),
										children: Object.entries(STATUS_KO).map(([k, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: k,
											children: label
										}, k))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "h-9 rounded-md border border-line px-3 text-sm",
										onClick: () => patch(row.assetId, { seenAt: (/* @__PURE__ */ new Date()).toISOString() }),
										children: "확인함"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "h-9 rounded-md border border-line px-3 text-sm",
										onClick: () => patch(row.assetId, { snoozeUntil: new Date(Date.now() + 864e5).toISOString() }),
										children: "하루 미루기"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, { assetId: row.assetId })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm",
								children: ["무효화: ", row.invalidation || "없음"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: ["노트: ", row.note || "없음"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-1 text-sm",
								children: row.conditions.map((c) => {
									const result = snoozed ? {
										fired: false,
										detail: "미루는 중"
									} : evalCondition(c, quote, etf5);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex flex-wrap items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											result.fired ? "조건 충족" : "대기",
											" · ",
											result.detail
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "text-xs text-muted",
											onClick: () => removeCondition(row.assetId, c.id),
											children: "삭제"
										})]
									}, c.id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/coins/$assetId",
								params: { assetId: row.assetId },
								search: {
									...search,
									tab: "notes"
								},
								className: "mt-2 inline-block text-sm text-accent",
								children: "코인 메모"
							})
						]
					}) }, row.assetId);
				})
			})
		]
	});
}
//#endregion
export { WatchPage as component };
