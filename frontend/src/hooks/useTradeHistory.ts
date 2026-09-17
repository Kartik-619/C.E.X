"use client";

import { useState, useEffect, useCallback } from "react";
import type { TradeHistoryEntry } from "@/types/api";
import { subscribe, unsubscribe } from "@/services/websocket";
import type { WSMessage, WSTradeExecuted } from "@/types/websocket";
import { useAuth } from "@/context/UserContext";

export function useTradeHistory() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [trades, setTrades] = useState<TradeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const handleTrade = (message: WSMessage) => {
      if (message.type !== "TRADE_EXECUTED") return;
      const { data } = message as WSTradeExecuted;

      const isBuyer = data.buyerId === userId;
      const isSeller = data.sellerId === userId;
      if (!isBuyer && !isSeller) return;

      setTrades((prev) => [
        {
          id: data.tradeId,
          price: data.price,
          quantity: data.quantity,
          side: isBuyer ? "buy" : "sell",
          timestamp: String(data.timestamp),
          orderId: String(isBuyer ? data.buyOrderId : data.sellOrderId),
        },
        ...prev,
      ]);
    };

    subscribe("TRADE_EXECUTED", handleTrade);

    const timer = setTimeout(() => setLoading(false), 400);

    return () => {
      unsubscribe("TRADE_EXECUTED", handleTrade);
      clearTimeout(timer);
    };
  }, [userId]);

  const clear = useCallback(() => setTrades([]), []);

  return { trades, loading, clear };
}
