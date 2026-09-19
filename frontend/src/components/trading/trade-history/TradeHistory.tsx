"use client";

import React from "react";
import { useTradeHistory } from "@/hooks/useTradeHistory";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { ErrorState } from "@/components/ui/error-state/ErrorState";
import { formatPrice, formatQuantity } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge/Badge";

export const TradeHistory: React.FC = () => {
  const { trades, loading, error } = useTradeHistory();

  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold">Recent Trades</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold">Recent Trades</h2>
        <ErrorState title="Couldn't load trade history" description={error} />
      </section>
    );
  }

  if (trades.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold">Recent Trades</h2>
        <EmptyState
          title="No trades yet"
          description="Recent market trades will appear here in real time."
        />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-base font-semibold">Recent Trades</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
              <th className="pb-2 pr-4">Price</th>
              <th className="pb-2 pr-4">Quantity</th>
              <th className="pb-2 pr-4">Side</th>
              <th className="pb-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 8).map((trade) => (
              <tr
                key={trade.tradeId}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
              >
                <td className="py-2.5 pr-4 font-medium tabular-nums">
                  {formatPrice(trade.price)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums text-zinc-600 dark:text-zinc-300">
                  {formatQuantity(trade.quantity)}
                </td>
                <td className="py-2.5 pr-4">
                  {trade.side ? (
                    <Badge variant={trade.side === "buy" ? "buy" : "sell"}>
                      {trade.side.toUpperCase()}
                    </Badge>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </td>
                <td className="py-2.5 text-right text-xs text-zinc-400">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};