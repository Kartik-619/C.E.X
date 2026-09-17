"use client";

import { useState, useEffect, useCallback } from "react";
import type { TradeHistoryEntry } from "@/types/api";
import { subscribe, unsubscribe } from "@/services/websocket";
import type { WSMessage, WSTradeExecuted } from "@/types/websocket";

export function useTradeHistory() {
  const [trades, setTrades] = useState<TradeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleTrade = (message: WSMessage) => {
      if (message.type !== "TRADE_EXECUTED") return;
      const tradeMessage = message as WSTradeExecuted;
      const { data } = tradeMessage;
      setTrades((prev) => [
        {
          id: data.tradeId,
          price: data.price,
          quantity: data.quantity,
          side: "buy",
          timestamp: String(data.timestamp),
          orderId: String(data.buyOrderId),
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
  }, []);

  const clear = useCallback(() => setTrades([]), []);

  return { trades, loading, clear };
}
