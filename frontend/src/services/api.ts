import type {
  OrderRequest,
  OrderResponse,
  BalanceResponse,
  DepositRequest,
  OrderBookSnapshot,
  HealthResponse,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
} from "../types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010/api";
const TOKEN_KEY = "cex_auth_token";

// ── Token management ────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ── Helpers ─────────────────────────────────────────────────────────

function extractErrorMessage(errorData: Record<string, unknown> | undefined, fallback: string): string {
  if (!errorData) return fallback;
  const message = errorData.error ?? errorData.message;
  return typeof message === "string" && message.length > 0 ? message : fallback;
}

// ── Auth API ────────────────────────────────────────────────────────

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Registration failed"));
  }

  return response.json() as Promise<AuthResponse>;
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Login failed"));
  }

  return response.json() as Promise<AuthResponse>;
}

// ── Protected API (requires auth header) ────────────────────────────

export async function getBalance(userId: string): Promise<BalanceResponse> {
  const response = await fetch(`${API_BASE_URL}/balance/${userId}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Failed to fetch balance"));
  }

  return response.json() as Promise<BalanceResponse>;
}

export async function depositFunds(request: DepositRequest): Promise<BalanceResponse> {
  const response = await fetch(`${API_BASE_URL}/balance/deposit`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Failed to deposit funds"));
  }

  return response.json() as Promise<BalanceResponse>;
}

export async function getOrderBook(): Promise<OrderBookSnapshot> {
  const response = await fetch(`${API_BASE_URL}/orderbook`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Failed to fetch order book"));
  }

  return response.json() as Promise<OrderBookSnapshot>;
}

export async function placeOrder(request: OrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Failed to place order"));
  }

  return response.json() as Promise<OrderResponse>;
}

export async function addPassiveOrder(request: OrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Failed to add passive order"));
  }

  return response.json() as Promise<OrderResponse>;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Failed to cancel order"));
  }
}

// ── Public API ──────────────────────────────────────────────────────

export async function healthCheck(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => undefined);
    throw new Error(extractErrorMessage(errorData, "Health check failed"));
  }

  return response.json() as Promise<HealthResponse>;
}
