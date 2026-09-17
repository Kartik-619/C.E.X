"use client";

import React from "react";
import { formatPrice, formatQuantity } from "@/utils/formatters";
import { useOrderBook } from "@/hooks/useOrderBook";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export const OrderBook: React.FC = () => {
  const { orderBook, loading, error, refresh } = useOrderBook();

  const handleRefresh = () => {
    refresh();
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Order Book</h2>
          <span className="text-xs text-zinc-400">Loading</span>
        </div>
        <div className="space-y-2">
          <Skeleton height="0.75rem" width="100%" />
          <Skeleton height="0.75rem" width="90%" />
          <Skeleton height="0.75rem" width="95%" />
          <Skeleton height="0.75rem" width="85%" />
          <Skeleton height="0.75rem" width="100%" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Order Book</h2>
          <span className="text-xs text-zinc-400">Error</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  if (!orderBook) return null;

  const { bids = [], asks = [] } = orderBook;
  const maxBids = Math.max(...bids.map((b) => b.quantity), 1);
  const maxAsks = Math.max(...asks.map((a) => a.quantity), 1);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Order Book</h2>
        <button
          onClick={handleRefresh}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          aria-label="Refresh order book"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 gap-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        <span>Price</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (reversed, best ask at bottom) */}
      <div className="space-y-0.5">
        {[...asks]
          .slice()
          .reverse()
          .map((level, i) => (
            <div key={`ask-${i}`} className="relative h-5 overflow-hidden rounded-sm">
              <span
                className="absolute inset-y-0 right-0 bg-red-50 dark:bg-red-950/30"
                style={{ width: `${(level.quantity / maxAsks) * 100}%` }}
              />
              <div className="relative grid grid-cols-3 gap-2 px-1.5 text-xs tabular-nums">
                <span className="text-red-600 dark:text-red-400">{formatPrice(level.price)}</span>
                <span className="text-right text-zinc-600 dark:text-zinc-300">{formatQuantity(level.quantity)}</span>
                <span className="text-right text-zinc-400">{formatQuantity(level.quantity * level.price)}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Midpoint divider */}
      <div className="my-3 border-t border-dashed border-zinc-200 dark:border-zinc-800" />

      {/* Bids */}
      <div className="space-y-0.5">
        {bids.map((level, i) => (
          <div key={`bid-${i}`} className="relative h-5 overflow-hidden rounded-sm">
            <span
              className="absolute inset-y-0 right-0 bg-emerald-50 dark:bg-emerald-950/30"
              style={{ width: `${(level.quantity / maxBids) * 100}%` }}
            />
            <div className="relative grid grid-cols-3 gap-2 px-1.5 text-xs tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(level.price)}</span>
              <span className="text-right text-zinc-600 dark:text-zinc-300">{formatQuantity(level.quantity)}</span>
              <span className="text-right text-zinc-400">{formatQuantity(level.quantity * level.price)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>Bid depth: {formatQuantity(orderBook.reducedTotalBidQuantity || 0)}</span>
        <span>Ask depth: {formatQuantity(orderBook.reducedTotalAskQuantity || 0)}</span>
      </div>
    </section>
  );
};
