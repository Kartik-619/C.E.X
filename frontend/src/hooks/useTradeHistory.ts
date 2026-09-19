"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MarketTrade } from "@/types/api";
import { getTradeHistory } from "@/services/api";
import { subscribe, unsubscribe } from "@/services/websocket";
import type { WSMessage, WSTradeExecuted } from "@/types/websocket";
import { useAuth } from "@/context/UserContext";

const DEFAULT_SYMBOL = "BTC/USD";
const DEFAULT_LIMIT = 20;

function classifySide(
  buyerId: string,
  sellerId: string,
  userId: string | null
): "buy" | "sell" | null {
  if (!userId) return null;
  if (buyerId === userId) return "buy";
  if (sellerId === userId) return "sell";
  return null;
}

export function useTradeHistory(limit: number = DEFAULT_LIMIT) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [trades, setTrades] = useState<MarketTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const liveArrived = useRef(false);

  // Load persisted market trade history on mount / user change.
  useEffect(() => {
    let cancelled = false;
    liveArrived.current = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTradeHistory(DEFAULT_SYMBOL, limit);
        if (cancelled) return;
        setTrades((prev) => {
          // Live trades may have streamed in while the fetch was in flight;
          // keep them so they are not wiped by the resolved response.
          if (liveArrived.current && prev.length > 0) return prev;
          return data.map((trade) => ({
            ...trade,
            side: classifySide(trade.buyerId, trade.sellerId, userId),
          }));
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch trade history"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, limit]);

  // Live market feed: prepend every executed trade (broadcast publicly).
  useEffect(() => {
    const handleTrade = (message: WSMessage) => {
      if (message.type !== "TRADE_EXECUTED") return;
      const { data } = message as WSTradeExecuted;
      liveArrived.current = true;

      setTrades((prev) =>
        [
          {
            tradeId: data.tradeId,
            symbol: data.symbol,
            price: data.price,
            quantity: data.quantity,
            totalValue: data.totalValue,
            timestamp: String(data.timestamp),
            buyerId: data.buyerId,
            sellerId: data.sellerId,
            side: classifySide(data.buyerId, data.sellerId, userId),
          },
          ...prev,
        ].slice(0, limit)
      );
    };

    subscribe("TRADE_EXECUTED", handleTrade);

    return () => {
      unsubscribe("TRADE_EXECUTED", handleTrade);
    };
  }, [userId, limit]);

  const clear = useCallback(() => setTrades([]), []);

  return { trades, loading, error, clear };
}