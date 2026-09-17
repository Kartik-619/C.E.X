"use client";

import { useState, useEffect, useCallback } from "react";
import { subscribe, unsubscribe } from "@/services/websocket";
import type {
  WSMessage,
  WSTradeExecuted,
  WSOrderFilled,
  WSOrderCancelled,
} from "@/types/websocket";
import { useAuth } from "@/context/UserContext";

export interface ActivityEntry {
  id: string;
  type: "trade" | "fill" | "cancel";
  side: "buy" | "sell";
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
  orderId: string;
}

export function useActivityHistory() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const handleTrade = (message: WSMessage) => {
      if (message.type !== "TRADE_EXECUTED") return;
      const { data } = message as WSTradeExecuted;

      const isBuyer = data.buyerId === userId;
      const isSeller = data.sellerId === userId;
      if (!isBuyer && !isSeller) return;

      setEntries((prev) => [
        {
          id: data.tradeId,
          type: "trade",
          side: isBuyer ? "buy" : "sell",
          symbol: data.symbol,
          price: data.price,
          quantity: data.quantity,
          timestamp: Date.parse(String(data.timestamp)),
          orderId: String(isBuyer ? data.buyOrderId : data.sellOrderId),
        },
        ...prev,
      ]);
    };

    const handleFill = (message: WSMessage) => {
      if (message.type !== "ORDER_FILLED") return;
      const { data } = message as WSOrderFilled;
      if (data.userId !== userId) return;
      setEntries((prev) => [
        {
          id: `fill-${data.orderId}-${data.timestamp}`,
          type: "fill",
          side: data.side,
          symbol: data.symbol,
          price: data.price,
          quantity: data.quantity,
          timestamp: data.timestamp,
          orderId: data.orderId,
        },
        ...prev,
      ]);
    };

    const handleCancel = (message: WSMessage) => {
      if (message.type !== "ORDER_CANCELLED") return;
      const { data } = message as WSOrderCancelled;
      if (data.userId !== userId) return;
      setEntries((prev) => [
        {
          id: `cancel-${data.orderId}-${data.timestamp}`,
          type: "cancel",
          side: data.side,
          symbol: data.symbol,
          price: data.price,
          quantity: data.quantity,
          timestamp: data.timestamp,
          orderId: data.orderId,
        },
        ...prev,
      ]);
    };

    subscribe("TRADE_EXECUTED", handleTrade);
    subscribe("ORDER_FILLED", handleFill);
    subscribe("ORDER_CANCELLED", handleCancel);

    const timer = setTimeout(() => setLoading(false), 400);

    return () => {
      unsubscribe("TRADE_EXECUTED", handleTrade);
      unsubscribe("ORDER_FILLED", handleFill);
      unsubscribe("ORDER_CANCELLED", handleCancel);
      clearTimeout(timer);
    };
  }, [userId]);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, loading, clear };
}