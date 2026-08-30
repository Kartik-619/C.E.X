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
      const tradeMessage = message as WSTradeExecuted;
      if (tradeMessage.type !== "TRADE_EXECUTED") return;
      setTrades((prev) => [tradeMessage.trade, ...prev]);
    };

    subscribe("TRADE_EXECUTED", handleTrade);

    const timer = setTimeout(() => setLoading(false), 400);

    return () => {
      unsubscribe("TRADE_EXECUTED");
      clearTimeout(timer);
    };
  }, []);

  const clear = useCallback(() => setTrades([]), []);

  return { trades, loading, clear };
}
