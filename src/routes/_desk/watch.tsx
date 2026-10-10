import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { AssetLink, Panel, SaveButton, useDesk, quoteOf } from "@/components/desk-ui";
import { evalCondition, sessionWindow } from "@/lib/desk/rules";
import { STATUS_KO } from "@/lib/desk/search";
import { useWatch, type WatchRow } from "@/lib/desk/watch-store";
import { csvCell, seoul } from "@/lib/desk/format";
import { z } from "zod";

export const Route = createFileRoute("/_desk/watch")({
  component: WatchPage,
});

const ImportRow = z.object({
  assetId: z.string().max(40),
  savedAt: z.string().max(40),
  status: z.enum(["priority", "watch", "waiting", "risk", "gap"]),
  note: z.string().max(2000),
  invalidation: z.string().max(2000),
  snoozeUntil: z.string().max(40).nullable(),
  seenAt: z.string().max(40).nullable(),
  conditions: z.array(z.object({
    id: z.string().max(80),
    assetId: z.string().max(40),
    field: z.enum(["priceUsd", "change24hPct", "etf5", "funding"]),
    cmp: z.enum(["gt", "lt"]),
    value: z.number(),
    note: z.string().max(500),
  })).max(20),
});

function WatchPage() {
  const desk = useDesk();
  const search = useSearch({ from: "/_desk" });
  const rows = useWatch((s) => s.rows);
  const patch = useWatch((s) => s.patch);
  const removeCondition = useWatch((s) => s.removeCondition);
  const replaceAll = useWatch((s) => s.replaceAll);

  function exportCsv() {
    const header = ["asset", "status", "note", "invalidation"].map(csvCell).join(",");
    const body = rows.map((r) => [r.assetId, r.status, r.note, r.invalidation].map(csvCell).join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investpan-watch.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">알림은 이 화면이 열려 데이터를 읽은 순간에만 계산됩니다. 백그라운드 워커는 없습니다.</p>
      <div className="flex gap-2">
        <button type="button" className="h-9 rounded-md border border-line px-3 text-sm" onClick={exportCsv}>CSV 보내기</button>
        <label className="inline-flex h-9 items-center rounded-md border border-line px-3 text-sm">
          JSON 가져오기
          <input type="file" accept="application/json" className="sr-only" onChange={async (e) => {
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
          }} />
        </label>
      </div>
      {!rows.length ? <p className="text-sm text-muted">저장된 관심 없음.</p> : null}
      <ul className="space-y-3">
        {rows.map((row) => {
          const asset = desk.assets.find((a) => a.id === row.assetId);
          const quote = quoteOf(desk, row.assetId);
          const etf5 = sessionWindow(desk.etf.sessions.filter((s) => s.assetId === row.assetId), 0, 5).sum;
          const snoozed = row.snoozeUntil != null && Date.parse(row.snoozeUntil) > Date.now();
          return (
            <li key={row.assetId}>
              <Panel title={asset ? `${asset.symbol} ${asset.nameKo}` : row.assetId} aside={seoul(row.savedAt)}>
                {asset ? <AssetLink id={asset.id} search={search} symbol={asset.symbol} name={asset.nameKo} /> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <select className="h-9 rounded-md border border-line bg-bg px-2 text-sm" value={row.status} onChange={(e) => patch(row.assetId, { status: e.target.value as WatchRow["status"] })}>
                    {Object.entries(STATUS_KO).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                  <button type="button" className="h-9 rounded-md border border-line px-3 text-sm" onClick={() => patch(row.assetId, { seenAt: new Date().toISOString() })}>확인함</button>
                  <button type="button" className="h-9 rounded-md border border-line px-3 text-sm" onClick={() => patch(row.assetId, { snoozeUntil: new Date(Date.now() + 86400000).toISOString() })}>하루 미루기</button>
                  <SaveButton assetId={row.assetId} />
                </div>
                <p className="mt-2 text-sm">무효화: {row.invalidation || "없음"}</p>
                <p className="text-sm text-muted">노트: {row.note || "없음"}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {row.conditions.map((c) => {
                    const result = snoozed ? { fired: false, detail: "미루는 중" } : evalCondition(c, quote, etf5);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>{result.fired ? "조건 충족" : "대기"} · {result.detail}</span>
                        <button type="button" className="text-xs text-muted" onClick={() => removeCondition(row.assetId, c.id)}>삭제</button>
                      </li>
                    );
                  })}
                </ul>
                <Link to="/coins/$assetId" params={{ assetId: row.assetId }} search={{ ...search, tab: "notes" }} className="mt-2 inline-block text-sm text-accent">코인 메모</Link>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
