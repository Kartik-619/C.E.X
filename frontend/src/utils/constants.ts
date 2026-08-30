export const CURRENCIES = ["USD", "BTC", "ETH", "USDT"] as const;

export type Currency = typeof CURRENCIES[number];

export const SIDE_LABELS = {
  buy: "BUY",
  sell: "SELL",
} as const;

export type Side = "buy" | "sell";

export const ORDER_STATUS = {
  pending: "Pending",
  filled: "Filled",
  cancelled: "Cancelled",
} as const;

export type OrderStatus = "pending" | "filled" | "cancelled";