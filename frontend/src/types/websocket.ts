import type { OrderResponse, TradeHistoryEntry } from "./api";

export type WSEventType =
  | "ORDER_PLACED"
  | "TRADE_EXECUTED"
  | "ORDER_FILLED"
  | "ORDER_CANCELLED";

export interface WSOrderPlaced {
  type: "ORDER_PLACED";
  order: OrderResponse;
}

export interface WSTradeExecuted {
  type: "TRADE_EXECUTED";
  trade: TradeHistoryEntry;
}

export interface WSOrderFilled {
  type: "ORDER_FILLED";
  order: OrderResponse;
}

export interface WSOrderCancelled {
  type: "ORDER_CANCELLED";
  orderId: string;
}

export type WSMessage =
  | WSOrderPlaced
  | WSTradeExecuted
  | WSOrderFilled
  | WSOrderCancelled;