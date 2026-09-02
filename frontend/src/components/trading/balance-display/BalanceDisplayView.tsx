"use client";

import React from "react";
import type { BalanceResponse } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { formatCurrency } from "@/utils/formatters";

interface BalanceDisplayViewProps {
  balance: BalanceResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const BalanceDisplayView: React.FC<BalanceDisplayViewProps> = ({
  balance,
  loading,
  error,
  refetch,
}) => {
  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5">
          <Skeleton height="1rem" width="40%" />
        </div>
        <div className="space-y-4">
          <Skeleton height="3rem" width="60%" />
          <Skeleton height="0.75rem" width="100%" />
          <div className="flex gap-4">
            <Skeleton height="1rem" width="30%" />
            <Skeleton height="1rem" width="30%" />
          </div>
        </div>
      </section>
    );
  }

  if (error && !balance) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold">Account Balance</h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  if (!balance) return null;

  const total = balance.total || 0;
  const availablePct = total > 0 ? (balance.available / total) * 100 : 100;
  const lockedPct = total > 0 ? (balance.locked / total) * 100 : 0;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">Account Balance</h2>
        <button
          onClick={refetch}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Refresh
        </button>
      </div>

      <div className="mb-5">
        <span className="text-3xl font-bold tabular-nums tracking-tight">
          {formatCurrency(balance.total, balance.asset)}
        </span>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Total balance</p>
      </div>

      {total > 0 && (
        <div className="mb-5">
          <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${availablePct}%` }}
            />
            {lockedPct > 0 && (
              <div
                className="bg-amber-400 transition-all duration-500 dark:bg-amber-500"
                style={{ width: `${lockedPct}%` }}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Available</p>
          <p className="mt-1 text-sm font-semibold tabular-nums">
            {formatCurrency(balance.available, balance.asset)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Locked</p>
          <p className="mt-1 text-sm font-semibold tabular-nums">
            {formatCurrency(balance.locked, balance.asset)}
          </p>
        </div>
      </div>
    </section>
  );
};
