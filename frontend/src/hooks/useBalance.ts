"use client";

import type { BalanceResponse } from "@/types/api";
import { getBalance } from "@/services/api";
import { useState, useCallback, useEffect } from "react";

export function useBalance(userId: string) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getBalance(userId);
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

  return { balance, loading, error, refetch };
}
