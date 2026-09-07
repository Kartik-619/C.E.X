import type { OrderResponse, TradeHistoryEntry } from "./api";

export type WSEventType =
  | "ORDER_PLACED"
  | "TRADE_EXECUTED"
  | "ORDER_FILLED"
  | "ORDER_CANCELLED"
  | "ORDER_PENDING"
  | "ORDER_FAILED"
  | "OTPASKED"
  | "OTP_FAILED";

export interface WSOrderPlaced {
  type: "ORDER_PLACED";
  data: {
    orderId: number;
    userId: string;
    symbol: string;
    side: "buy" | "sell";
    price: number;
    quantity: number;
    status: string;
    timestamp: number;
  };
}

export interface WSTradeExecuted {
  type: "TRADE_EXECUTED";
  data: {
    tradeId: string;
    buyOrderId: number;
    sellOrderId: number;
    buyerId: string;
    sellerId: string;
    symbol: string;
    price: number;
    quantity: number;
    totalValue: number;
    timestamp: number;
  };
}

export interface WSOrderFilled {
  type: "ORDER_FILLED";
  data: {
    orderId: string;
    userId: string;
    symbol: string;
    side: "buy" | "sell";
    price: number;
    quantity: number;
    status: "FILLED";
    timestamp: number;
  };
}

export interface WSOrderCancelled {
  type: "ORDER_CANCELLED";
  data: {
    orderId: string;
    userId: string;
    symbol: string;
    side: "buy" | "sell";
    price: number;
    quantity: number;
    status: "CANCELLED";
    timestamp: number;
  };
}

export interface WSOrderFailed {
  type: "ORDER_FAILED";
  data: {
    orderId: string;
    userId: string;
    symbol: string;
    reason: string;
    required: number;
    available: number;
    timestamp: number;
  };
}

export interface WSOrderPending {
  type: "ORDER_PENDING";
  data: {
    orderId: string;
    userId: string;
    symbol: string;
    timestamp: number;
  };
}

export interface WSOTPAsked {
  type: "OTPASKED";
  data: {
    userId: string;
    timestamp: number;
  };
}

export interface WSOTPFailed {
  type: "OTP_FAILED";
  data: {
    userId: string;
    timestamp: number;
  };
}

export type WSMessage =
  | WSOrderPlaced
  | WSTradeExecuted
  | WSOrderFilled
  | WSOrderCancelled
  | WSOrderFailed
  | WSOrderPending
  | WSOTPAsked
  | WSOTPFailed;