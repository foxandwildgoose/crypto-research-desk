import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-C8g6LV52.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getDesk_createServerFn_handler = createServerRpc({
	id: "af873d8ea92d52c8b1a52c6e0a9a43ab935c1729288377a5cbb9c8127834f434",
	name: "getDesk",
	filename: "src/lib/desk/api.ts"
}, (opts) => getDesk.__executeServer(opts));
var getDesk = createServerFn({ method: "GET" }).handler(getDesk_createServerFn_handler, async () => {
	const { loadDesk } = await import("./load.server-CA9gMRcg.mjs");
	return loadDesk("no");
});
var refreshMarket_createServerFn_handler = createServerRpc({
	id: "dfaf4f65758d4046a0aa4d34a572343cd72f1b4c45ef5c1491cafc6d6dc23a4f",
	name: "refreshMarket",
	filename: "src/lib/desk/api.ts"
}, (opts) => refreshMarket.__executeServer(opts));
var refreshMarket = createServerFn({ method: "POST" }).handler(refreshMarket_createServerFn_handler, async () => {
	const { loadDesk } = await import("./load.server-CA9gMRcg.mjs");
	return loadDesk("market");
});
var refreshResearch_createServerFn_handler = createServerRpc({
	id: "8b2fa0302efe8c9e47bd686a7c95803c3e49b663b9c64a60964dc16c7b93b77e",
	name: "refreshResearch",
	filename: "src/lib/desk/api.ts"
}, (opts) => refreshResearch.__executeServer(opts));
var refreshResearch = createServerFn({ method: "POST" }).handler(refreshResearch_createServerFn_handler, async () => {
	const { loadDesk } = await import("./load.server-CA9gMRcg.mjs");
	return loadDesk("research");
});
var refreshSocial_createServerFn_handler = createServerRpc({
	id: "0639f0180bc6db19943abecfb7442ec4b74a75b57940aa0f3b9c5504c9337aee",
	name: "refreshSocial",
	filename: "src/lib/desk/api.ts"
}, (opts) => refreshSocial.__executeServer(opts));
var refreshSocial = createServerFn({ method: "POST" }).handler(refreshSocial_createServerFn_handler, async () => {
	const { loadSocial } = await import("./load.server-CA9gMRcg.mjs");
	return loadSocial();
});
//#endregion
export { getDesk_createServerFn_handler, refreshMarket_createServerFn_handler, refreshResearch_createServerFn_handler, refreshSocial_createServerFn_handler };
