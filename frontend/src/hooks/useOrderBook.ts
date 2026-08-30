"use client";

import type { OrderBookSnapshot } from "@/types/api";
import { getOrderBook } from "@/services/api";
import { subscribe, unsubscribe } from "@/services/websocket";
import type { WSMessage } from "@/types/websocket";
import { useState, useCallback, useEffect } from "react";

export function useOrderBook() {
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderBook();
      setOrderBook(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch order book");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getOrderBook();
        if (!cancelled) setOrderBook(data);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to fetch order book");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const handleUpdate = (message: WSMessage) => {
      if (message.type === "ORDER_PLACED" || message.type === "ORDER_CANCELLED") {
        refresh();
      }
    };

    subscribe("ORDER_PLACED", handleUpdate);
    subscribe("ORDER_CANCELLED", handleUpdate);

    return () => {
      cancelled = true;
      unsubscribe("ORDER_PLACED");
      unsubscribe("ORDER_CANCELLED");
    };
  }, [refresh]);

  return { orderBook, loading, error, refresh };
}
