import type { OrderRequest, OrderResponse, BalanceResponse, OrderBookSnapshot, HealthResponse } from "../types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function getBalance(userId: string): Promise<BalanceResponse> {
  const response = await fetch(`${API_BASE_URL}/balance/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch balance");
  }

  return response.json() as Promise<BalanceResponse>;
}

export async function getOrderBook(): Promise<OrderBookSnapshot> {
  const response = await fetch(`${API_BASE_URL}/orderbook`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch order book");
  }

  return response.json() as Promise<OrderBookSnapshot>;
}

export async function placeOrder(request: OrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to place order");
  }

  return response.json() as Promise<OrderResponse>;
}

export async function addPassiveOrder(request: OrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add passive order");
  }

  return response.json() as Promise<OrderResponse>;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to cancel order");
  }
}

export async function healthCheck(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Health check failed");
  }

  return response.json() as Promise<HealthResponse>;
}