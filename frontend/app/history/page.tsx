"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { Badge } from "@/components/ui/badge/Badge";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { PageLoader } from "@/components/ui/page-loader/PageLoader";
import { useActivityHistory } from "@/hooks/useActivityHistory";
import { useWebSocketContext } from "@/context/WebSocketContext";
import { useAuth } from "@/context/UserContext";
import { formatPrice, formatQuantity } from "@/utils/formatters";

export default function HistoryPage() {
  const { connected } = useWebSocketContext();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const { entries, loading: historyLoading } = useActivityHistory();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header
        connected={connected}
        onToggleSidebar={() => setMobileNavOpen((v) => !v)}
        username={user.username || user.email}
      />

      <div className="flex flex-1">
        <Sidebar
          className="w-60 shrink-0"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">History</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Your trades, fills, and cancellations in this session
              </p>
            </div>

            <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              {historyLoading ? (
                <div className="animate-pulse space-y-3 p-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 rounded bg-zinc-100 dark:bg-zinc-800" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No activity yet"
                    description="Your executed trades, fills, and cancellations will appear here in real time."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                        <th className="px-5 py-3">Time</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Side</th>
                        <th className="px-5 py-3">Symbol</th>
                        <th className="px-5 py-3">Price</th>
                        <th className="px-5 py-3">Quantity</th>
                        <th className="px-5 py-3 text-right">Order ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                        >
                          <td className="px-5 py-3 text-xs text-zinc-400">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <Badge
                              variant={
                                entry.type === "cancel"
                                  ? "negative"
                                  : entry.type === "fill"
                                    ? "positive"
                                    : "warning"
                              }
                            >
                              {entry.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={entry.side === "buy" ? "buy" : "sell"}>
                              {entry.side.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 font-medium">{entry.symbol}</td>
                          <td className="px-5 py-3 tabular-nums">
                            {formatPrice(entry.price)}
                          </td>
                          <td className="px-5 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">
                            {formatQuantity(entry.quantity)}
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-zinc-400">
                            #{entry.orderId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}