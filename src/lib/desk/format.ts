const MONTHS: Record<string, number> = {
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
  december: 12,
};

export function seoul(iso: string | null | undefined, withTime = true): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : {}),
  }).format(d);
}

export function seoulDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [y, m, d] = isoDate.split("-");
    return `${y}.${m}.${d}`;
  }
  return seoul(isoDate, false);
}

export function fmtUsd(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (abs >= 1) return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: digits })}`;
  if (abs === 0) return "$0";
  return `${sign}$${abs.toPrecision(3)}`;
}

export function fmtQty(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 0 : 4 });
}

export function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function fmtPx(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(4)}`;
}

export function signedClass(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n === 0) return "text-muted";
  return n > 0 ? "text-up" : "text-down";
}

export function parseUsdCell(raw: string): number | null {
  const s = raw.trim();
  if (!s || s === "-" || s === "—" || s === "–" || s === "N/A") return null;
  const neg = /^\s*-/.test(s) || s.includes("(");
  const m = s.replace(/[()]/g, "").match(/([0-9][0-9.,]*)\s*([KMBT])?/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const u = (m[2] || "").toUpperCase();
  const mult = u === "T" ? 1e12 : u === "B" ? 1e9 : u === "M" ? 1e6 : u === "K" ? 1e3 : 1;
  const v = n * mult;
  if (v === 0) return 0;
  return neg ? -v : v;
}

export function parseMillionsCell(raw: string): number | null {
  const s = raw.trim().replace(/[$,]/g, "");
  if (!s || s === "-" || s === "—" || s === "–") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n * 1e6;
}

export function parseFee(raw: string): number | null {
  const m = raw.trim().match(/([0-9.]+)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function monthDateToIso(label: string): string | null {
  const m = label.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
}

export function etDateTime(date: string, hour24: number, minute: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const utcHour = hour24 + 4;
  const ms = Date.UTC(y, m - 1, d, utcHour, minute);
  return new Date(ms).toISOString();
}

export function decodeEntities(s: string): string {
  return s
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function csvCell(value: string): string {
  const neutralized = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

export function slugId(symbol: string, name: string): string {
  const sym = symbol.split(".")[0].toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (sym) return sym;
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "co";
}
