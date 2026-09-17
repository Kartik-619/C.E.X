"use client";

import type { BalanceResponse } from "@/types/api";
import { getBalance, depositFunds } from "@/services/api";
import { useState, useCallback, useEffect } from "react";

export function useBalance(userId: string | null) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositing, setDepositing] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBalance(userId);
      setBalance(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deposit = useCallback(
    async (amount: number, asset = "USD"): Promise<BalanceResponse | null> => {
      if (!userId) return null;
      setDepositing(true);
      setError(null);
      try {
        const data = await depositFunds({ userId, asset, amount });
        setBalance(data);
        return data;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to deposit funds";
        setError(message);
        return null;
      } finally {
        setDepositing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) return;

    const id = userId;
    let cancelled = false;

    async function load() {
      try {
        const data = await getBalance(id);
        if (!cancelled) setBalance(data);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to fetch balance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { balance, loading, error, depositing, refetch, deposit };
}
