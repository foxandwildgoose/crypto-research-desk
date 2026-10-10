import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watch-store-DK3fR7jm.js
function blank(assetId) {
	return {
		assetId,
		savedAt: (/* @__PURE__ */ new Date()).toISOString(),
		status: "watch",
		note: "",
		invalidation: "",
		snoozeUntil: null,
		conditions: [],
		seenAt: null
	};
}
var useWatch = create()(persist((set) => ({
	rows: [],
	log: [],
	save: (assetId) => set((state) => state.rows.some((r) => r.assetId === assetId) ? state : { rows: [blank(assetId), ...state.rows] }),
	remove: (assetId) => set((state) => ({ rows: state.rows.filter((r) => r.assetId !== assetId) })),
	patch: (assetId, partial) => set((state) => ({ rows: state.rows.map((r) => r.assetId === assetId ? {
		...r,
		...partial
	} : r) })),
	addCondition: (assetId, condition) => set((state) => {
		return { rows: (state.rows.some((r) => r.assetId === assetId) ? state.rows : [blank(assetId), ...state.rows]).map((r) => r.assetId === assetId ? {
			...r,
			conditions: [...r.conditions.filter((c) => c.id !== condition.id), condition]
		} : r) };
	}),
	removeCondition: (assetId, id) => set((state) => ({ rows: state.rows.map((r) => r.assetId === assetId ? {
		...r,
		conditions: r.conditions.filter((c) => c.id !== id)
	} : r) })),
	replaceAll: (rows) => set({ rows }),
	pushLog: (scope, result) => set((state) => ({ log: [{
		at: (/* @__PURE__ */ new Date()).toISOString(),
		scope,
		result
	}, ...state.log].slice(0, 12) }))
}), {
	name: "investpan-watch-v1",
	skipHydration: true
}));
//#endregion
export { useWatch as t };
