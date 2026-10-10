import { useEffect, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Candle } from "@/lib/desk/types";
import { fmtUsd } from "@/lib/desk/format";

function Frame({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="h-52 w-full" />;
  return <div className="h-52 w-full">{children}</div>;
}

export function PriceChart({ candles }: { candles: Candle[] }) {
  const data = candles.map((c) => ({
    day: new Date(c.t).toISOString().slice(0, 10),
    close: c.c,
    volume: c.v,
  }));
  return (
    <Frame>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "var(--color-muted)", fontSize: 11 }} minTickGap={24} />
          <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} width={72} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value) => fmtUsd(Number(value), 4)}
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", color: "var(--color-ink)" }}
          />
          <Line type="monotone" dataKey="close" name="종가" stroke="var(--color-accent)" dot={false} strokeWidth={1.6} />
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function FlowChart({ rows }: { rows: { day: string; flow: number }[] }) {
  return (
    <Frame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "var(--color-muted)", fontSize: 11 }} minTickGap={24} />
          <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} width={64} />
          <Tooltip
            formatter={(value) => fmtUsd(Number(value))}
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", color: "var(--color-ink)" }}
          />
          <Bar dataKey="flow" name="순유입">
            {rows.map((row) => (
              <Cell key={row.day} fill={row.flow >= 0 ? "var(--color-up)" : "var(--color-down)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function StepChart({ rows }: { rows: { day: string; qty: number }[] }) {
  return (
    <Frame>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} width={80} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString("en-US")}
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", color: "var(--color-ink)" }}
          />
          <Line type="stepAfter" dataKey="qty" name="보유" stroke="var(--color-accent)" strokeWidth={1.6} dot />
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  );
}
