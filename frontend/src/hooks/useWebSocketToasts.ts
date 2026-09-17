"use client";

import { useEffect } from "react";
import { toast } from "react-toastify";
import { subscribe, unsubscribe } from "@/services/websocket";
import type {
  WSMessage,
  WSOrderFilled,
  WSOrderCancelled,
  WSOrderFailed,
  WSOrderPending,
  WSTradeExecuted,
  WSOTPAsked,
  WSOTPFailed,
} from "@/types/websocket";

function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function useWebSocketToasts(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const onFilled = (message: WSMessage) => {
      if (message.type !== "ORDER_FILLED") return;
      const { data } = message as WSOrderFilled;
      const side = data.side === "buy" ? "Buy" : "Sell";
      toast.success(`${side} order filled: ${data.quantity} ${data.symbol} @ ${formatPrice(data.price)}`);
    };

    const onCancelled = (message: WSMessage) => {
      if (message.type !== "ORDER_CANCELLED") return;
      const { data } = message as WSOrderCancelled;
      const side = data.side === "buy" ? "Buy" : "Sell";
      toast.info(`${side} order cancelled: ${data.quantity} ${data.symbol}`);
    };

    const onFailed = (message: WSMessage) => {
      if (message.type !== "ORDER_FAILED") return;
      const { data } = message as WSOrderFailed;
      toast.error(`Order failed: ${data.reason}`);
    };

    const onPending = (message: WSMessage) => {
      if (message.type !== "ORDER_PENDING") return;
      toast.warning("Order is pending...");
    };

    const onTrade = (message: WSMessage) => {
      if (message.type !== "TRADE_EXECUTED") return;
      const { data } = message as WSTradeExecuted;
      if (data.buyerId !== userId && data.sellerId !== userId) return;
      const side = data.buyerId === userId ? "Bought" : "Sold";
      toast.success(`${side} ${data.quantity} ${data.symbol} @ ${formatPrice(data.price)}`);
    };

    const onOTPAsked = (message: WSMessage) => {
      if (message.type !== "OTPASKED") return;
      toast.info("OTP verification required");
    };

    const onOTPFailed = (message: WSMessage) => {
      if (message.type !== "OTP_FAILED") return;
      toast.error("OTP verification failed");
    };

    subscribe("ORDER_FILLED", onFilled);
    subscribe("ORDER_CANCELLED", onCancelled);
    subscribe("ORDER_FAILED", onFailed);
    subscribe("ORDER_PENDING", onPending);
    subscribe("TRADE_EXECUTED", onTrade);
    subscribe("OTPASKED", onOTPAsked);
    subscribe("OTP_FAILED", onOTPFailed);

    return () => {
      unsubscribe("ORDER_FILLED", onFilled);
      unsubscribe("ORDER_CANCELLED", onCancelled);
      unsubscribe("ORDER_FAILED", onFailed);
      unsubscribe("ORDER_PENDING", onPending);
      unsubscribe("TRADE_EXECUTED", onTrade);
      unsubscribe("OTPASKED", onOTPAsked);
      unsubscribe("OTP_FAILED", onOTPFailed);
    };
  }, [userId]);
}
