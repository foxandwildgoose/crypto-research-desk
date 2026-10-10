import { i as __toESM } from "../_runtime.mjs";
import { s as fmtUsd } from "./format-Du1nKKBb.mjs";
import { Q as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Line, c as Cell, i as XAxis, l as ResponsiveContainer, n as LineChart, o as CartesianGrid, r as YAxis, s as Bar, t as BarChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/charts-BedTQwVx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Frame({ children }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-52 w-full" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-52 w-full",
		children
	});
}
function PriceChart({ candles }) {
	const data = candles.map((c) => ({
		day: new Date(c.t).toISOString().slice(0, 10),
		close: c.c,
		volume: c.v
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height: "100%",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
			data,
			margin: {
				top: 8,
				right: 8,
				left: 0,
				bottom: 0
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
					stroke: "var(--color-line)",
					vertical: false
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
					dataKey: "day",
					tick: {
						fill: "var(--color-muted)",
						fontSize: 11
					},
					minTickGap: 24
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
					tick: {
						fill: "var(--color-muted)",
						fontSize: 11
					},
					width: 72,
					domain: ["auto", "auto"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
					formatter: (value) => fmtUsd(Number(value), 4),
					contentStyle: {
						background: "var(--color-surface)",
						border: "1px solid var(--color-line)",
						color: "var(--color-ink)"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
					type: "monotone",
					dataKey: "close",
					name: "종가",
					stroke: "var(--color-accent)",
					dot: false,
					strokeWidth: 1.6
				})
			]
		})
	}) });
}
function FlowChart({ rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height: "100%",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
			data: rows,
			margin: {
				top: 8,
				right: 8,
				left: 0,
				bottom: 0
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
					stroke: "var(--color-line)",
					vertical: false
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
					dataKey: "day",
					tick: {
						fill: "var(--color-muted)",
						fontSize: 11
					},
					minTickGap: 24
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
					tick: {
						fill: "var(--color-muted)",
						fontSize: 11
					},
					width: 64
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
					formatter: (value) => fmtUsd(Number(value)),
					contentStyle: {
						background: "var(--color-surface)",
						border: "1px solid var(--color-line)",
						color: "var(--color-ink)"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
					dataKey: "flow",
					name: "순유입",
					children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: row.flow >= 0 ? "var(--color-up)" : "var(--color-down)" }, row.day))
				})
			]
		})
	}) });
}
function StepChart({ rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height: "100%",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
			data: rows,
			margin: {
				top: 8,
				right: 8,
				left: 0,
				bottom: 0
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
					stroke: "var(--color-line)",
					vertical: false
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
					dataKey: "day",
					tick: {
						fill: "var(--color-muted)",
						fontSize: 11
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
					tick: {
						fill: "var(--color-muted)",
						fontSize: 11
					},
					width: 80,
					domain: ["auto", "auto"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
					formatter: (value) => Number(value).toLocaleString("en-US"),
					contentStyle: {
						background: "var(--color-surface)",
						border: "1px solid var(--color-line)",
						color: "var(--color-ink)"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
					type: "stepAfter",
					dataKey: "qty",
					name: "보유",
					stroke: "var(--color-accent)",
					strokeWidth: 1.6,
					dot: true
				})
			]
		})
	}) });
}
//#endregion
export { PriceChart as n, StepChart as r, FlowChart as t };
