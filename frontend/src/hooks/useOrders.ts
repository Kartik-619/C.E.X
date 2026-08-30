"use client";

import type { OrderRequest, OrderResponse } from "@/types/api";
import { placeOrder as placeOrderService, addPassiveOrder as addPassiveOrderService, cancelOrder as cancelOrderService } from "@/services/api";
import { useState, useCallback } from "react";

export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeLimitOrder = useCallback(
    async (
      userId: string,
      symbol: string,
      side: "buy" | "sell",
      price: number,
      quantity: number
    ): Promise<OrderResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const request: OrderRequest = { userId, symbol, side, price, quantity, type: "LIMIT" };
        const data = await placeOrderService(request);
        setLoading(false);
        return data;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to place order");
        setLoading(false);
        return null;
      }
    },
    []
  );

  const placeMarketOrder = useCallback(
    async (
      userId: string,
      symbol: string,
      side: "buy" | "sell",
      quantity: number
    ): Promise<OrderResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const request: OrderRequest = { userId, symbol, side, price: 0, quantity, type: "MARKET" };
        const data = await placeOrderService(request);
        setLoading(false);
        return data;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to place order");
        setLoading(false);
        return null;
      }
    },
    []
  );

  const cancelOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await cancelOrderService(orderId);
        setLoading(false);
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to cancel order");
        setLoading(false);
        return false;
      }
    },
    []
  );

  const addPassiveOrder = useCallback(
    async (
      userId: string,
      symbol: string,
      side: "buy" | "sell",
      price: number,
      quantity: number
    ): Promise<OrderResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const request: OrderRequest = { userId, symbol, side, price, quantity, type: "LIMIT" };
        const data = await addPassiveOrderService(request);
        setLoading(false);
        return data;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to add passive order");
        setLoading(false);
        return null;
      }
    },
    []
  );

  return {
    placeLimitOrder,
    placeMarketOrder,
    cancelOrder,
    addPassiveOrder,
    loading,
    error,
  };
}
