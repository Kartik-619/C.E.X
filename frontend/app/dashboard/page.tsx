"use client";

import React from "react";
import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { OrderBook } from "@/components/trading/order-book/OrderBook";
import { BalanceDisplay } from "@/components/trading/balance-display/BalanceDisplay";
import { OrderForm } from "@/components/trading/order-form/OrderForm";
import { TradeHistory } from "@/components/trading/trade-history/TradeHistory";
import { useWebSocketContext } from "@/context/WebSocketContext";

const USER_ID = "user-1234";

export default function Dashboard() {
  const { connected } = useWebSocketContext();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header
        connected={connected}
        onToggleSidebar={() => setMobileNavOpen((v) => !v)}
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
              <h1 className="text-2xl font-bold tracking-tight">Trading Dashboard</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Market overview for BTC/USD
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              {/* Left column: balance + order form */}
              <div className="space-y-5 xl:col-span-4">
                <BalanceDisplay />
                <OrderForm userId={USER_ID} />
              </div>

              {/* Right column: order book + trade history */}
              <div className="space-y-5 xl:col-span-8">
                <OrderBook />
                <TradeHistory />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
