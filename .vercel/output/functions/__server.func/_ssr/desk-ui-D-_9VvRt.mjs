import { i as __toESM } from "../_runtime.mjs";
import { a as fmtPx, f as safeHttpUrl, h as signedClass, i as fmtPct, o as fmtQty, p as seoul, s as fmtUsd } from "./format-Du1nKKBb.mjs";
import { C as useLoaderData, Q as require_react, T as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as STATUS_KO } from "./router-CqXd9UYe.mjs";
import { t as useWatch } from "./watch-store-DK3fR7jm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-ui-D-_9VvRt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useDesk() {
	return useLoaderData({ from: "/_desk" });
}
function Money({ n, applicable = true }) {
	if (!applicable) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-muted",
		children: "N/A"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `font-mono text-sm tabular-nums ${signedClass(n)}`,
		children: fmtUsd(n)
	});
}
function Pct({ n }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `font-mono text-sm tabular-nums ${signedClass(n)}`,
		children: fmtPct(n)
	});
}
function Qty({ n }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-mono text-sm tabular-nums",
		children: fmtQty(n)
	});
}
function Px({ n }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-mono text-sm tabular-nums",
		children: fmtPx(n)
	});
}
function Ext({ href, children }) {
	const url = safeHttpUrl(href);
	if (!url) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-muted",
		children
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		className: "text-accent underline-offset-2 hover:underline",
		href: url,
		target: "_blank",
		rel: "noreferrer",
		children
	});
}
function Panel({ title, aside, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 max-w-full rounded-md border border-line bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-baseline justify-between gap-3 border-b border-line px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold",
				children: title
			}), aside ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: aside
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-3",
			children
		})]
	});
}
function SaveButton({ assetId }) {
	const rows = useWatch((s) => s.rows);
	const save = useWatch((s) => s.save);
	const remove = useWatch((s) => s.remove);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	const on = ready && rows.some((r) => r.assetId === assetId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `h-9 rounded-md px-3 text-sm ${on ? "bg-accent text-accent-fg" : "border border-line bg-bg"}`,
		onClick: () => on ? remove(assetId) : save(assetId),
		children: on ? "저장됨" : "관심"
	});
}
function AssetLink({ id, search, symbol, name }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/coins/$assetId",
		params: { assetId: id },
		search,
		className: "font-medium hover:text-accent",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono",
			children: symbol
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ml-2 text-muted",
			children: name
		})]
	});
}
function StatusText({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: STATUS_KO[status] });
}
function When({ iso }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
		className: "font-mono text-xs text-muted tabular-nums",
		children: seoul(iso)
	});
}
function quoteOf(desk, id) {
	return desk.quotes.find((q) => q.assetId === id);
}
function assetOf(desk, id) {
	return desk.assets.find((a) => a.id === id);
}
//#endregion
export { Pct as a, SaveButton as c, assetOf as d, quoteOf as f, Panel as i, StatusText as l, Ext as n, Px as o, useDesk as p, Money as r, Qty as s, AssetLink as t, When as u };
