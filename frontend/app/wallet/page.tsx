"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { BalanceDisplayView } from "@/components/trading/balance-display/BalanceDisplayView";
import { DepositForm } from "@/components/trading/deposit-form/DepositForm";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { useBalance } from "@/hooks/useBalance";
import { useWebSocketContext } from "@/context/WebSocketContext";
import { useAuth } from "@/context/UserContext";
import { formatCurrency } from "@/utils/formatters";

const DEFAULT_USER_ID = "alice";

export default function Wallet() {
  const { connected } = useWebSocketContext();
  const { user, loading } = useAuth();
  const router = useRouter();
  const userId = user?.id || DEFAULT_USER_ID;
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const { balance, loading: balanceLoading, error, refetch, deposit, depositing } =
    useBalance(userId);

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
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage your account balance and deposits
              </p>
            </div>

            {balanceLoading ? (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <Skeleton height="0.75rem" width="40%" />
                    <div className="mt-2">
                      <Skeleton height="1.5rem" width="60%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : balance ? (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Available
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(balance.available, balance.asset)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Locked
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatCurrency(balance.locked, balance.asset)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Total
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums">
                    {formatCurrency(balance.total, balance.asset)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <BalanceDisplayView
                  balance={balance}
                  loading={balanceLoading}
                  error={error}
                  refetch={refetch}
                />
              </div>

              <div className="xl:col-span-5">
                <DepositForm onDeposit={deposit} depositing={depositing} error={error} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
