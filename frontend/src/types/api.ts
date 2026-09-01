export interface OrderRequest {
  userId: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  type?: "LIMIT" | "MARKET";
}

export interface OrderResponse {
  id: string;
  userId: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  status: "pending" | "filled" | "cancelled";
  totalValue: number;
  createdAt: string;
}

export interface BalanceResponse {
  userId: string;
  asset: string;
  available: number;
  locked: number;
  total: number;
}

export interface OrderBookSnapshot {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  reducedTotalBidQuantity: number;
  reducedTotalAskQuantity: number;
  timestamp: string;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface TradeHistoryEntry {
  id: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  timestamp: string;
  orderId: string;
}

// ── Auth ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}