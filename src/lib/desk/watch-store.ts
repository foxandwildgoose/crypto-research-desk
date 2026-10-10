import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AlertCondition, ReviewStatus } from "./rules.ts";

export type WatchRow = {
  assetId: string;
  savedAt: string;
  status: ReviewStatus;
  note: string;
  invalidation: string;
  snoozeUntil: string | null;
  conditions: AlertCondition[];
  seenAt: string | null;
};

type WatchState = {
  rows: WatchRow[];
  log: { at: string; scope: string; result: string }[];
  save: (assetId: string) => void;
  remove: (assetId: string) => void;
  patch: (assetId: string, partial: Partial<WatchRow>) => void;
  addCondition: (assetId: string, condition: AlertCondition) => void;
  removeCondition: (assetId: string, id: string) => void;
  replaceAll: (rows: WatchRow[]) => void;
  pushLog: (scope: string, result: string) => void;
};

function blank(assetId: string): WatchRow {
  return {
    assetId,
    savedAt: new Date().toISOString(),
    status: "watch",
    note: "",
    invalidation: "",
    snoozeUntil: null,
    conditions: [],
    seenAt: null,
  };
}

export const useWatch = create<WatchState>()(
  persist(
    (set) => ({
      rows: [],
      log: [],
      save: (assetId) =>
        set((state) =>
          state.rows.some((r) => r.assetId === assetId) ? state : { rows: [blank(assetId), ...state.rows] },
        ),
      remove: (assetId) => set((state) => ({ rows: state.rows.filter((r) => r.assetId !== assetId) })),
      patch: (assetId, partial) =>
        set((state) => ({
          rows: state.rows.map((r) => (r.assetId === assetId ? { ...r, ...partial } : r)),
        })),
      addCondition: (assetId, condition) =>
        set((state) => {
          const rows = state.rows.some((r) => r.assetId === assetId) ? state.rows : [blank(assetId), ...state.rows];
          return {
            rows: rows.map((r) =>
              r.assetId === assetId ? { ...r, conditions: [...r.conditions.filter((c) => c.id !== condition.id), condition] } : r,
            ),
          };
        }),
      removeCondition: (assetId, id) =>
        set((state) => ({
          rows: state.rows.map((r) =>
            r.assetId === assetId ? { ...r, conditions: r.conditions.filter((c) => c.id !== id) } : r,
          ),
        })),
      replaceAll: (rows) => set({ rows }),
      pushLog: (scope, result) =>
        set((state) => ({ log: [{ at: new Date().toISOString(), scope, result }, ...state.log].slice(0, 12) })),
    }),
    { name: "investpan-watch-v1", skipHydration: true },
  ),
);
