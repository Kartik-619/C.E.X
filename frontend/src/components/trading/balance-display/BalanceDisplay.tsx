"use client";

import React from "react";
import { useBalance } from "@/hooks/useBalance";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { formatCurrency } from "@/utils/formatters";

interface BalanceDisplayProps {
  userId?: string;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ userId = "user-1234" }) => {
  const { balance, loading, error, refetch } = useBalance(userId);

  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Account Balance</h2>
        </div>
        <div className="space-y-3">
          <Skeleton height="2rem" width="50%" />
          <Skeleton height="1rem" width="70%" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold">Account Balance</h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  if (!balance) return null;

  const rows = [
    { label: "Available", value: balance.available },
    { label: "Locked", value: balance.locked },
    { label: "Total", value: balance.total },
  ];

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Account Balance</h2>
        <button
          onClick={refetch}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">
            {formatCurrency(balance.total, balance.asset)}
          </span>
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
            {balance.asset}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Total balance</p>
      </div>

      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <dt className="text-zinc-500 dark:text-zinc-400">{row.label}</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(row.value, balance.asset)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
