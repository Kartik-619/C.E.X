import { getToken } from "./api";
import type { WSMessage, WSEventType, WSOrderPlaced } from "../types/websocket";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010/api";
const FALLBACK_WS_URL = "ws://localhost:3010";

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

// The HTTP API and the WebSocket server share one port/origin, so the WS
// target is resolved at connect time:
// 1. NEXT_PUBLIC_WS_URL when explicitly set.
// 2. The origin of NEXT_PUBLIC_API_URL when it is an absolute URL.
// 3. The page origin (same server) otherwise.
// A localhost target from the build env is ignored when the page is served
// from another host, so no ws://localhost URL ever reaches a deployed browser.
function resolveWsUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;

  const pageOrigin = typeof window !== "undefined" ? window.location.origin : null;
  let apiOrigin: string | null = null;
  try {
    const url = new URL(API_BASE_URL, pageOrigin ?? undefined);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    apiOrigin = url.toString();
  } catch {
    apiOrigin = null;
  }

  if (apiOrigin && pageOrigin) {
    const apiHost = new URL(apiOrigin).hostname;
    const pageHost = new URL(pageOrigin).hostname;
    if (!isLocalhost(apiHost) || isLocalhost(pageHost)) return apiOrigin;
  } else if (apiOrigin) {
    return apiOrigin;
  }

  return pageOrigin ? pageOrigin.replace(/^http/, "ws") : FALLBACK_WS_URL;
}

function buildWsUrl(): string {
  const wsUrl = resolveWsUrl();
  const token = getToken();
  if (!token) return wsUrl;
  const separator = wsUrl.includes("?") ? "&" : "?";
  return `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
}

let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let manualClose = false;
const listeners: Map<WSEventType, Set<(message: WSMessage) => void>> = new Map();
let onConnectionChange: ((connected: boolean) => void) | null = null;
let onRealtimeMessage: ((message: WSMessage) => void) | null = null;

function notifyConnectionChange(connected: boolean): void {
  onConnectionChange?.(connected);
}


export function initWebSocket(
  onMessage: (message: WSMessage) => void,
  onStatusChange?: (connected: boolean) => void
): void {
  onRealtimeMessage = onMessage;
  if (onStatusChange) {
    onConnectionChange = onStatusChange;
  }

  if (websocket?.readyState === WebSocket.OPEN) {
    return;
  }

  websocket = new WebSocket(buildWsUrl());

  websocket.onopen = () => {
    console.log("WebSocket connected");
    notifyConnectionChange(true);
  };

  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WSMessage;
      onRealtimeMessage?.(message);
      listeners.get(message.type)?.forEach((listener) => listener(message));
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  websocket.onclose = () => {
    notifyConnectionChange(false);
    if (manualClose) {
      manualClose = false;
      console.log("WebSocket disconnected");
      return;
    }
    console.log("WebSocket disconnected, attempting reconnection...");
    scheduleReconnect();
  };

  websocket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function scheduleReconnect(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    const socket = websocket;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket: live connection exists, skipping duplicate reconnect");
      return;
    }
    websocket = null;
    initWebSocket(onRealtimeMessage ?? (() => {}));
  }, 3000);
}

export function subscribe(eventType: WSEventType, callback: (message: WSMessage) => void): void {
  const existing = listeners.get(eventType);
  if (existing) {
    existing.add(callback);
  } else {
    listeners.set(eventType, new Set([callback]));
  }
}

export function unsubscribe(
  eventType: WSEventType,
  callback?: (message: WSMessage) => void
): void {
  if (!callback) {
    listeners.delete(eventType);
    return;
  }
  const set = listeners.get(eventType);
  if (!set) return;
  set.delete(callback);
  if (set.size === 0) {
    listeners.delete(eventType);
  }
}

export function sendOrderPlaced(message: WSOrderPlaced): void {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message));
  }
}

export function disconnect(): void {
  if (websocket) {
    manualClose = true;
    websocket.close();
    websocket = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}