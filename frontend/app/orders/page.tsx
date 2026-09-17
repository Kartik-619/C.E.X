"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { useUserOrders } from "@/hooks/useUserOrders";
import { useWebSocketContext } from "@/context/WebSocketContext";
import { useAuth } from "@/context/UserContext";
import { formatPrice, formatQuantity, formatCurrency } from "@/utils/formatters";

function statusVariant(status: string): "neutral" | "warning" | "positive" {
  switch (status) {
    case "PARTIALLY_FILLED":
      return "warning";
    case "FILLED":
      return "positive";
    default:
      return "neutral";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "PARTIALLY_FILLED":
      return "Partial";
    default:
      return "Open";
  }
}

export default function OrdersPage() {
  const { connected } = useWebSocketContext();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const { orders, loading: ordersLoading, error, cancellingId, cancelOrder } =
    useUserOrders(user?.id ?? null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
      </div>
    );
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Your open orders for BTC/USD
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                Place order
              </Button>
            </div>

            <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              {ordersLoading ? (
                <div className="animate-pulse space-y-3 p-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 rounded bg-zinc-100 dark:bg-zinc-800" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No open orders"
                    description="Orders you place will appear here. Place a limit order to get started."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                        <th className="px-5 py-3">Side</th>
                        <th className="px-5 py-3">Symbol</th>
                        <th className="px-5 py-3">Price</th>
                        <th className="px-5 py-3">Quantity</th>
                        <th className="px-5 py-3">Value</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Placed</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                        >
                          <td className="px-5 py-3">
                            <Badge variant={order.side === "buy" ? "buy" : "sell"}>
                              {order.side.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 font-medium">{order.symbol}</td>
                          <td className="px-5 py-3 tabular-nums">
                            {formatPrice(order.price)}
                          </td>
                          <td className="px-5 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">
                            {formatQuantity(order.quantity)}
                          </td>
                          <td className="px-5 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">
                            {formatCurrency(order.price * order.quantity, "USD")}
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={statusVariant(order.status)}>
                              {statusLabel(order.status)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-zinc-400">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={cancellingId === order.orderId}
                              onClick={() => cancelOrder(order.orderId)}
                            >
                              {cancellingId === order.orderId ? "Cancelling..." : "Cancel"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <p className="mt-4 text-xs text-zinc-400">
              Orders update live via WebSocket.{" "}
              <Link href="/history" className="font-medium underline">
                View your history
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}