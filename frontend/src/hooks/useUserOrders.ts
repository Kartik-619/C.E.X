"use client";

import { useState, useCallback, useEffect } from "react";
import type { OrderResponse } from "@/types/api";
import type {
  WSMessage,
  WSOrderPlaced,
  WSOrderFilled,
  WSOrderCancelled,
} from "@/types/websocket";
import {
  getUserOrders,
  cancelOrder as cancelOrderService,
} from "@/services/api";
import { subscribe, unsubscribe } from "@/services/websocket";

export interface UserOrder {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  status: string;
  createdAt: number;
}

function toUserOrder(order: OrderResponse): UserOrder {
  return {
    orderId: String(order.id),
    symbol: order.symbol,
    side: order.side,
    price: order.price,
    quantity: order.quantity,
    status: order.status,
    createdAt: new Date(order.createdAt).getTime(),
  };
}

export function useUserOrders(userId: string | null) {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const data = await getUserOrders();
        if (!cancelled) setOrders(data.map(toUserOrder));
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const upsertOrder = (message: WSMessage) => {
      if (message.type !== "ORDER_PLACED") return;
      const { data } = message as WSOrderPlaced;
      if (data.userId !== userId) return;
      const orderId = String(data.orderId);
      setOrders((prev) => {
        const existing = prev.find((o) => o.orderId === orderId);
        if (existing) {
          return prev.map((o) =>
            o.orderId === orderId
              ? {
                  ...o,
                  symbol: data.symbol,
                  side: data.side,
                  price: data.price,
                  quantity: data.quantity,
                  status: data.status,
                }
              : o
          );
        }
        return [
          {
            orderId,
            symbol: data.symbol,
            side: data.side,
            price: data.price,
            quantity: data.quantity,
            status: data.status,
            createdAt: data.timestamp,
          },
          ...prev,
        ];
      });
    };

    const removeOrder = (message: WSMessage) => {
      if (message.type !== "ORDER_CANCELLED" && message.type !== "ORDER_FILLED")
        return;
      const data = (message as WSOrderFilled | WSOrderCancelled).data;
      if (data.userId !== userId) return;
      const orderId = String(data.orderId);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    };

    subscribe("ORDER_PLACED", upsertOrder);
    subscribe("ORDER_CANCELLED", removeOrder);
    subscribe("ORDER_FILLED", removeOrder);

    return () => {
      cancelled = true;
      unsubscribe("ORDER_PLACED", upsertOrder);
      unsubscribe("ORDER_CANCELLED", removeOrder);
      unsubscribe("ORDER_FILLED", removeOrder);
    };
    }, [userId]);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserOrders();
      setOrders(data.map(toUserOrder));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    setCancellingId(orderId);
    setError(null);
    try {
      await cancelOrderService(orderId);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
      return false;
    } finally {
      setCancellingId(null);
    }
  }, []);

  return { orders, loading, error, cancellingId, cancelOrder, refetch };
}