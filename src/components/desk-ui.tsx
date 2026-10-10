import { Link, useLoaderData } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import type { DeskSearch } from "@/lib/desk/search";
import { STATUS_KO } from "@/lib/desk/search";
import type { DeskSnapshot } from "@/lib/desk/types";
import { fmtPct, fmtPx, fmtQty, fmtUsd, safeHttpUrl, seoul, signedClass } from "@/lib/desk/format";
import { useWatch } from "@/lib/desk/watch-store";

export function useDesk(): DeskSnapshot {
  return useLoaderData({ from: "/_desk" }) as DeskSnapshot;
}

export function Money({ n, applicable = true }: { n: number | null | undefined; applicable?: boolean }) {
  if (!applicable) return <span className="text-muted">N/A</span>;
  return <span className={`font-mono text-sm tabular-nums ${signedClass(n)}`}>{fmtUsd(n)}</span>;
}

export function Pct({ n }: { n: number | null | undefined }) {
  return <span className={`font-mono text-sm tabular-nums ${signedClass(n)}`}>{fmtPct(n)}</span>;
}

export function Qty({ n }: { n: number | null | undefined }) {
  return <span className="font-mono text-sm tabular-nums">{fmtQty(n)}</span>;
}

export function Px({ n }: { n: number | null | undefined }) {
  return <span className="font-mono text-sm tabular-nums">{fmtPx(n)}</span>;
}

export function Ext({ href, children }: { href: string | null | undefined; children: ReactNode }) {
  const url = safeHttpUrl(href);
  if (!url) return <span className="text-muted">{children}</span>;
  return (
    <a className="text-accent underline-offset-2 hover:underline" href={url} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function Panel({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="min-w-0 max-w-full rounded-md border border-line bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside ? <p className="text-xs text-muted">{aside}</p> : null}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function SaveButton({ assetId }: { assetId: string }) {
  const rows = useWatch((s) => s.rows);
  const save = useWatch((s) => s.save);
  const remove = useWatch((s) => s.remove);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const on = ready && rows.some((r) => r.assetId === assetId);
  return (
    <button
      type="button"
      className={`h-9 rounded-md px-3 text-sm ${on ? "bg-accent text-accent-fg" : "border border-line bg-bg"}`}
      onClick={() => (on ? remove(assetId) : save(assetId))}
    >
      {on ? "저장됨" : "관심"}
    </button>
  );
}

export function AssetLink({ id, search, symbol, name }: { id: string; search: DeskSearch; symbol: string; name: string }) {
  return (
    <Link to="/coins/$assetId" params={{ assetId: id }} search={search} className="font-medium hover:text-accent">
      <span className="font-mono">{symbol}</span>
      <span className="ml-2 text-muted">{name}</span>
    </Link>
  );
}

export function StatusText({ status }: { status: keyof typeof STATUS_KO }) {
  return <span>{STATUS_KO[status]}</span>;
}

export function When({ iso }: { iso: string | null | undefined }) {
  return <time className="font-mono text-xs text-muted tabular-nums">{seoul(iso)}</time>;
}

export function quoteOf(desk: DeskSnapshot, id: string) {
  return desk.quotes.find((q) => q.assetId === id);
}

export function assetOf(desk: DeskSnapshot, id: string) {
  return desk.assets.find((a) => a.id === id);
}
