//#region node_modules/.nitro/vite/services/ssr/assets/format-Du1nKKBb.js
var MONTHS = {
	january: 1,
	february: 2,
	march: 3,
	april: 4,
	may: 5,
	june: 6,
	july: 7,
	august: 8,
	september: 9,
	october: 10,
	november: 11,
	december: 12
};
function seoul(iso, withTime = true) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return new Intl.DateTimeFormat("ko-KR", {
		timeZone: "Asia/Seoul",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		...withTime ? {
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23"
		} : {}
	}).format(d);
}
function seoulDate(isoDate) {
	if (!isoDate) return "—";
	if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
		const [y, m, d] = isoDate.split("-");
		return `${y}.${m}.${d}`;
	}
	return seoul(isoDate, false);
}
function fmtUsd(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	const sign = n < 0 ? "-" : "";
	const abs = Math.abs(n);
	if (abs >= 0xe8d4a51000) return `${sign}$${(abs / 0xe8d4a51000).toFixed(2)}T`;
	if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
	if (abs >= 1e3) return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
	if (abs >= 1) return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: digits })}`;
	if (abs === 0) return "$0";
	return `${sign}$${abs.toPrecision(3)}`;
}
function fmtQty(n) {
	if (n == null || !Number.isFinite(n)) return "—";
	return n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 0 : 4 });
}
function fmtPct(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}
function fmtPx(n) {
	if (n == null || !Number.isFinite(n)) return "—";
	if (n >= 1e3) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
	if (n >= 1) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
	return `$${n.toPrecision(4)}`;
}
function signedClass(n) {
	if (n == null || !Number.isFinite(n) || n === 0) return "text-muted";
	return n > 0 ? "text-up" : "text-down";
}
function parseUsdCell(raw) {
	const s = raw.trim();
	if (!s || s === "-" || s === "—" || s === "–" || s === "N/A") return null;
	const neg = /^\s*-/.test(s) || s.includes("(");
	const m = s.replace(/[()]/g, "").match(/([0-9][0-9.,]*)\s*([KMBT])?/i);
	if (!m) return null;
	const n = Number(m[1].replace(/,/g, ""));
	if (!Number.isFinite(n)) return null;
	const u = (m[2] || "").toUpperCase();
	const v = n * (u === "T" ? 0xe8d4a51000 : u === "B" ? 1e9 : u === "M" ? 1e6 : u === "K" ? 1e3 : 1);
	if (v === 0) return 0;
	return neg ? -v : v;
}
function parseMillionsCell(raw) {
	const s = raw.trim().replace(/[$,]/g, "");
	if (!s || s === "-" || s === "—" || s === "–") return null;
	const n = Number(s);
	if (!Number.isFinite(n)) return null;
	return n * 1e6;
}
function parseFee(raw) {
	const m = raw.trim().match(/([0-9.]+)\s*%/);
	if (!m) return null;
	const n = Number(m[1]);
	return Number.isFinite(n) ? n : null;
}
function monthDateToIso(label) {
	const m = label.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
	if (!m) return null;
	const month = MONTHS[m[1].toLowerCase()];
	if (!month) return null;
	return `${m[3]}-${String(month).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
}
function etDateTime(date, hour24, minute) {
	const [y, m, d] = date.split("-").map(Number);
	const utcHour = hour24 + 4;
	const ms = Date.UTC(y, m - 1, d, utcHour, minute);
	return new Date(ms).toISOString();
}
function decodeEntities(s) {
	return s.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/'/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function safeHttpUrl(url) {
	if (!url) return null;
	try {
		const u = new URL(url);
		if (u.protocol !== "https:" && u.protocol !== "http:") return null;
		return u.toString();
	} catch {
		return null;
	}
}
function csvCell(value) {
	return `"${(/^[=+\-@]/.test(value) ? `'${value}` : value).replace(/"/g, "\"\"")}"`;
}
function slugId(symbol, name) {
	const sym = symbol.split(".")[0].toLowerCase().replace(/[^a-z0-9]+/g, "");
	if (sym) return sym;
	return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "co";
}
//#endregion
export { fmtPx as a, monthDateToIso as c, parseUsdCell as d, safeHttpUrl as f, slugId as g, signedClass as h, fmtPct as i, parseFee as l, seoulDate as m, decodeEntities as n, fmtQty as o, seoul as p, etDateTime as r, fmtUsd as s, csvCell as t, parseMillionsCell as u };
