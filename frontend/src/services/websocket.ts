import { getToken } from "./api";
import type { WSMessage, WSEventType, WSOrderPlaced } from "../types/websocket";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3011";

function buildWsUrl(): string {
  const token = getToken();
  if (!token) return WS_URL;
  const separator = WS_URL.includes("?") ? "&" : "?";
  return `${WS_URL}${separator}token=${encodeURIComponent(token)}`;
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