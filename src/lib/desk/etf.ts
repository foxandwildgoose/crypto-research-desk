import { z } from "zod";
import type {
  Asset,
  CryptoEtfRecord,
  CryptoEtfStatus,
  CryptoEtfType,
  EtfCatalog,
  EtfProduct,
} from "./types.ts";

export const STATUS_LABEL: Record<CryptoEtfStatus, string> = {
  filed: "신청",
  acknowledged: "접수 확인",
  under_review: "심사 중",
  amended: "수정 신청",
  delayed: "결정 연기",
  approved: "승인",
  approved_not_launched: "승인 · 출시 전",
  launched: "출시",
  trading: "거래 중",
  withdrawn: "철회",
  delisting_filed: "상장 폐지 신고",
  rejected: "거절",
  unverified: "상태 미확인",
};
export const TYPE_LABEL: Record<CryptoEtfType, string> = {
  spot: "현물",
  futures: "선물",
  leveraged: "레버리지",
  inverse: "인버스",
  basket: "다중 자산 · 바스켓",
  other: "기타",
  unresolved: "유형 미확인",
};
export type EtfSection = "approved" | "applications" | "historical" | "unverified";
const APPROVED = new Set<CryptoEtfStatus>([
  "approved",
  "approved_not_launched",
  "launched",
  "trading",
]);
const APPLICATIONS = new Set<CryptoEtfStatus>([
  "filed",
  "acknowledged",
  "under_review",
  "amended",
  "delayed",
]);
export function etfSection(record: CryptoEtfRecord): EtfSection {
  if (APPROVED.has(record.status)) return "approved";
  if (APPLICATIONS.has(record.status)) return "applications";
  if (["withdrawn", "rejected", "delisting_filed"].includes(record.status)) return "historical";
  return "unverified";
}

const text = z.string().trim().min(1).max(500);
const optionalText = text.nullable().default(null);
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Invalid calendar date",
  );
const timestamp = z.string().datetime({ offset: true });
const optionalDate = isoDate.nullable().default(null);
const optionalTimestamp = timestamp.nullable().default(null);
const httpsUrl = z
  .string()
  .url()
  .refine((v) => {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  }, "Use a public HTTPS source URL without credentials");
const statusSchema = z.enum(Object.keys(STATUS_LABEL) as [CryptoEtfStatus, ...CryptoEtfStatus[]]);
const typeSchema = z.enum(Object.keys(TYPE_LABEL) as [CryptoEtfType, ...CryptoEtfType[]]);
const evidenceSchema = z.object({
  url: httpsUrl,
  authority: z.enum(["regulator", "exchange", "issuer", "secondary"]),
  title: text,
  excerpt: z.string().trim().max(10000),
  asOf: optionalDate,
  verifiedAt: optionalTimestamp,
  status: statusSchema.nullable().default(null),
});
const recordSchema = z
  .object({
    id: text,
    aliases: z.array(text).default([]),
    underlyingAssets: z.array(
      z.object({
        assetId: z
          .string()
          .trim()
          .min(1)
          .max(100)
          .transform((v) => v.toLowerCase()),
        symbol: text.transform((v) => v.toUpperCase()),
        name: optionalText,
        weightPct: z.number().min(0).max(100).nullable().default(null),
      }),
    ),
    productName: optionalText,
    issuer: optionalText,
    ticker: optionalText,
    jurisdiction: text.transform((v) => v.toUpperCase()),
    productType: typeSchema,
    multiAsset: z.boolean().default(false),
    status: statusSchema,
    statusAsOf: optionalDate,
    filingDate: optionalDate,
    approvalDate: optionalDate,
    launchDate: optionalDate,
    deadline: optionalDate,
    exchange: optionalText,
    regulator: optionalText,
    filingUrl: httpsUrl.nullable().default(null),
    sourceUrl: httpsUrl,
    lastVerifiedAt: optionalTimestamp,
    identifiers: z
      .object({ cik: optionalText, seriesId: optionalText, registrationFile: optionalText })
      .default({ cik: null, seriesId: null, registrationFile: null }),
    evidence: z.array(evidenceSchema).default([]),
    note: z.string().max(10000).default(""),
  })
  .superRefine((r, ctx) => {
    if (!r.underlyingAssets.length && r.productType === "spot")
      ctx.addIssue({
        code: "custom",
        message: "A single-asset product needs an identified underlying asset",
      });
    if (new Set(r.underlyingAssets.map((a) => a.assetId)).size !== r.underlyingAssets.length)
      ctx.addIssue({ code: "custom", message: "Duplicate basket constituent" });
    const weights = r.underlyingAssets
      .map((a) => a.weightPct)
      .filter((w): w is number => w != null);
    if (weights.reduce((sum, w) => sum + w, 0) > 100.001)
      ctx.addIssue({ code: "custom", message: "Basket weights exceed 100%" });
  });
const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  scope: text,
  updatedAt: optionalTimestamp,
  complete: z.boolean().default(false),
  coverageNote: z.string().max(10000),
  records: z.array(recordSchema).max(10000),
  lastAttemptAt: optionalTimestamp,
  refreshError: z.string().max(2000).nullable().default(null),
});

/** A flow row, registration effectiveness, and generic listing standards are not a product approval. */
function supportedStatus(r: CryptoEtfRecord): boolean {
  return (
    r.status === "unverified" ||
    Boolean(
      r.statusAsOf &&
      r.lastVerifiedAt &&
      r.statusAsOf <= r.lastVerifiedAt.slice(0, 10) &&
      r.evidence.some(
        (e) =>
          e.authority !== "secondary" &&
          e.status === r.status &&
          e.asOf === r.statusAsOf &&
          e.verifiedAt &&
          e.asOf! <= e.verifiedAt.slice(0, 10) &&
          e.excerpt.trim(),
      ),
    )
  );
}

export function normalizeEtfCatalog(input: unknown): EtfCatalog {
  const parsed = catalogSchema.parse(input);
  const records = parsed.records.map((r): CryptoEtfRecord => {
    const record = {
      ...r,
      ticker: r.ticker?.toUpperCase() ?? null,
      productType: r.productType,
    };
    if (!supportedStatus(record))
      return {
        ...record,
        status: "unverified",
        note: [record.note, "일차 출처의 해당 상태·기준일·확인 근거가 없어 상태 미확인으로 보존."]
          .filter(Boolean)
          .join(" "),
      };
    return record;
  });
  // A completeness flag supplied by a feed alone cannot certify the global universe.
  return { ...parsed, complete: false, records: dedupeEtfRecords(records) };
}

function norm(v: string | null): string {
  return (v ?? "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
function identities(r: CryptoEtfRecord): string[] {
  const keys = [r.id, ...r.aliases].map((id) => `id:${id}`);
  const assets = r.underlyingAssets
    .map((a) => a.assetId)
    .sort()
    .join(",");
  const scope = `${r.jurisdiction}:${assets}:${r.productType}`;
  const cik = norm(r.identifiers.cik).replace(/^0+/, "");
  if (cik && r.identifiers.seriesId) keys.push(`series:${cik}:${norm(r.identifiers.seriesId)}`);
  // A registration file can contain multiple fund series; it is not a standalone product key.
  if (r.ticker && r.exchange)
    keys.push(
      `ticker:${r.jurisdiction}:${norm(r.exchange)}:${norm(r.ticker)}:${assets}:${r.productType}`,
    );
  if (r.issuer && r.productName)
    keys.push(`name:${norm(r.issuer)}:${norm(r.productName)}:${scope}`);
  return keys;
}

function evidenceKey(e: CryptoEtfRecord["evidence"][number]): string {
  return `${e.url}|${e.asOf}|${e.status}|${e.excerpt}`;
}
function recordDate(r: CryptoEtfRecord): string {
  return r.statusAsOf ?? r.filingDate ?? r.launchDate ?? r.approvalDate ?? "";
}
function mergeRecords(rows: CryptoEtfRecord[]): CryptoEtfRecord {
  // Latest dated primary state wins; a newly retrieved older source cannot resurrect a withdrawn filing.
  const ordered = [...rows].sort(
    (a, b) =>
      Number(b.status !== "unverified") - Number(a.status !== "unverified") ||
      recordDate(b).localeCompare(recordDate(a)) ||
      (b.lastVerifiedAt ?? "").localeCompare(a.lastVerifiedAt ?? "") ||
      a.id.localeCompare(b.id),
  );
  const winner = ordered[0];
  const evidence = new Map<string, CryptoEtfRecord["evidence"][number]>();
  for (const r of ordered)
    for (const e of r.evidence) if (!evidence.has(evidenceKey(e))) evidence.set(evidenceKey(e), e);
  const datedStatuses = new Set(
    [...evidence.values()]
      .filter(
        (e) =>
          e.authority !== "secondary" &&
          e.verifiedAt &&
          e.excerpt &&
          e.asOf === winner.statusAsOf &&
          e.status !== "unverified",
      )
      .map((e) => e.status)
      .filter(Boolean),
  );
  const conflict =
    datedStatuses.size > 1 ||
    ordered.some(
      (r) =>
        r.status !== "unverified" &&
        winner.status !== "unverified" &&
        recordDate(r) === recordDate(winner) &&
        r.status !== winner.status,
    );
  return {
    ...winner,
    filingDate: ordered.find((r) => r.filingDate)?.filingDate ?? null,
    approvalDate: ordered.find((r) => r.approvalDate)?.approvalDate ?? null,
    launchDate: ordered.find((r) => r.launchDate)?.launchDate ?? null,
    aliases: [...new Set(rows.flatMap((r) => [r.id, ...r.aliases]))].filter(
      (id) => id !== winner.id,
    ),
    evidence: [...evidence.values()],
    status: conflict ? "unverified" : winner.status,
    note: [
      ...new Set([
        ...rows.map((r) => r.note).filter(Boolean),
        ...(conflict ? ["같은 기준일의 일차 출처 상태가 충돌하여 확인 필요."] : []),
      ]),
    ].join(" "),
  };
}

export function dedupeEtfRecords(records: CryptoEtfRecord[]): CryptoEtfRecord[] {
  const parent = records.map((_, i) => i);
  const root = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const seen = new Map<string, number>();
  records.forEach((r, i) =>
    identities(r).forEach((key) => {
      const other = seen.get(key);
      if (other != null) parent[root(i)] = root(other);
      else seen.set(key, i);
    }),
  );
  const buckets = new Map<number, CryptoEtfRecord[]>();
  records.forEach((r, i) => {
    const k = root(i);
    buckets.set(k, [...(buckets.get(k) ?? []), r]);
  });
  return [...buckets.values()].map(mergeRecords).sort((a, b) => a.id.localeCompare(b.id));
}

export function mergeEtfCatalog(previous: EtfCatalog, next: EtfCatalog): EtfCatalog {
  if (previous.scope !== next.scope)
    throw new Error("ETF catalog market scope changed; review the source before replacing records");
  return {
    ...next,
    records: dedupeEtfRecords([...previous.records, ...next.records]),
    complete: false,
  };
}

export function recordsFromFlows(
  products: EtfProduct[],
  assets: Asset[],
  asOf: string | null,
): CryptoEtfRecord[] {
  return dedupeEtfRecords(
    products.map((p) => {
      const asset = assets.find((a) => a.id === p.assetId);
      return {
        id: `flow:${p.jurisdiction}:${p.assetId}:${p.ticker}`,
        aliases: [],
        underlyingAssets: [
          {
            assetId: p.assetId,
            symbol: asset?.symbol ?? p.assetId.toUpperCase(),
            name: asset?.name ?? null,
            weightPct: null,
          },
        ],
        productName: null,
        issuer: p.issuer || null,
        ticker: p.ticker || null,
        jurisdiction: p.jurisdiction,
        productType: "unresolved",
        status: "unverified",
        statusAsOf: null,
        filingDate: null,
        approvalDate: null,
        launchDate: null,
        deadline: null,
        exchange: null,
        regulator: null,
        filingUrl: null,
        sourceUrl: p.sourceUrl,
        lastVerifiedAt: null,
        identifiers: { cik: null, seriesId: null, registrationFile: null },
        evidence: [
          {
            url: p.sourceUrl,
            authority: "secondary",
            title: "저장된 ETF 자금 표",
            excerpt: "자금 표의 행만 관찰. 규제 상태와 상품 유형의 일차 근거는 미확인.",
            asOf: p.sessionDate ?? asOf?.slice(0, 10) ?? null,
            verifiedAt: null,
            status: null,
          },
        ],
        note: "자금 표가 있다는 사실만으로 승인·거래 상태나 현물 유형을 판정하지 않음.",
      } satisfies CryptoEtfRecord;
    }),
  );
}

export function assetEtfRecords(records: CryptoEtfRecord[], assetId: string): CryptoEtfRecord[] {
  return records.filter(
    (r) =>
      r.productType !== "basket" &&
      !r.multiAsset &&
      r.underlyingAssets.length === 1 &&
      r.underlyingAssets[0].assetId === assetId,
  );
}
export type EtfGroup = {
  key: string;
  symbol: string;
  name: string;
  records: CryptoEtfRecord[];
  approvedCount: number;
  applicationCount: number;
};
export function groupEtfRecords(records: CryptoEtfRecord[]): EtfGroup[] {
  const groups = new Map<string, EtfGroup>();
  for (const r of dedupeEtfRecords(records)) {
    const basket = r.multiAsset || r.productType === "basket" || r.underlyingAssets.length > 1;
    const asset = r.underlyingAssets[0];
    const key = basket ? "basket" : (asset?.assetId ?? "unknown");
    const g = groups.get(key) ?? {
      key,
      symbol: basket ? "Multi-Asset" : (asset?.symbol ?? "Unknown"),
      name: basket ? "Crypto Basket" : (asset?.name ?? asset?.symbol ?? "Underlying not verified"),
      records: [],
      approvedCount: 0,
      applicationCount: 0,
    };
    g.records.push(r);
    if (etfSection(r) === "approved") g.approvedCount++;
    if (etfSection(r) === "applications") g.applicationCount++;
    groups.set(key, g);
  }
  for (const g of groups.values())
    g.records.sort(
      (a, b) =>
        Number(b.status === "trading") - Number(a.status === "trading") ||
        recordDate(b).localeCompare(recordDate(a)) ||
        (a.ticker ?? a.productName ?? a.id).localeCompare(b.ticker ?? b.productName ?? b.id),
    );
  return [...groups.values()].sort(
    (a, b) =>
      b.approvedCount - a.approvedCount ||
      b.applicationCount - a.applicationCount ||
      a.symbol.localeCompare(b.symbol),
  );
}
export function summarizeEtfRecords(records: CryptoEtfRecord[]) {
  const unique = dedupeEtfRecords(records);
  const approved = unique.filter((r) => etfSection(r) === "approved");
  const applications = unique.filter((r) => etfSection(r) === "applications");
  return {
    approvedAssets: groupEtfRecords(approved).filter((g) => !["basket", "unknown"].includes(g.key))
      .length,
    approvedProducts: approved.length,
    applicationAssets: groupEtfRecords(applications).filter(
      (g) => !["basket", "unknown"].includes(g.key),
    ).length,
    applications: applications.length,
    historical: unique.filter((r) => etfSection(r) === "historical").length,
    unverified: unique.filter((r) => etfSection(r) === "unverified").length,
  };
}
export function filterEtfRecords(
  records: CryptoEtfRecord[],
  filters: {
    query?: string;
    asset?: string;
    productType?: string;
    issuer?: string;
    status?: string;
    section?: string;
  },
): CryptoEtfRecord[] {
  const q = filters.query?.trim().toLowerCase();
  return dedupeEtfRecords(records).filter((r) => {
    const basket = r.multiAsset || r.productType === "basket" || r.underlyingAssets.length > 1;
    if (
      filters.asset &&
      filters.asset !== "all" &&
      (basket
        ? filters.asset !== "basket"
        : r.underlyingAssets.length
          ? !r.underlyingAssets.some((a) => a.assetId === filters.asset)
          : filters.asset !== "unknown")
    )
      return false;
    if (
      filters.productType &&
      filters.productType !== "all" &&
      (filters.productType === "leveraged_inverse"
        ? !["leveraged", "inverse"].includes(r.productType)
        : filters.productType === "basket"
          ? !basket
          : r.productType !== filters.productType)
    )
      return false;
    if (filters.issuer && filters.issuer !== "all" && r.issuer !== filters.issuer) return false;
    if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.section && filters.section !== "all" && etfSection(r) !== filters.section)
      return false;
    const blob = [
      r.ticker,
      r.productName,
      r.issuer,
      ...r.underlyingAssets.flatMap((a) => [a.assetId, a.symbol, a.name]),
    ]
      .join(" ")
      .toLowerCase();
    return !q || blob.includes(q);
  });
}
