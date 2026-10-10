export type DeskSearch = {
  q: string;
  h: "t" | "s";
  w: "7" | "30" | "90";
  theme: string;
  watch: "0" | "1";
  etf: "all" | "yes" | "no";
  dat: "all" | "yes" | "no";
  venue: string;
  cmp: string;
  tab: string;
  kind: string;
};

function str(v: unknown) {
  return typeof v === "string" ? v.slice(0, 80) : "";
}

export function deskSearch(search: Record<string, unknown>): DeskSearch {
  const w = str(search.w);
  const etf = str(search.etf);
  const dat = str(search.dat);
  return {
    q: str(search.q),
    h: search.h === "s" ? "s" : "t",
    w: w === "7" || w === "90" ? w : "30",
    theme: str(search.theme),
    watch: search.watch === "1" ? "1" : "0",
    etf: etf === "yes" || etf === "no" ? etf : "all",
    dat: dat === "yes" || dat === "no" ? dat : "all",
    venue: str(search.venue),
    cmp: str(search.cmp),
    tab: str(search.tab),
    kind: str(search.kind) || "treasury",
  };
}

export const STATUS_KO = {
  priority: "우선 검토",
  watch: "관찰",
  waiting: "조건 대기",
  risk: "위험 점검",
  gap: "자료 부족",
} as const;
