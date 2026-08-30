import type { WSMessage, WSEventType, WSOrderPlaced } from "../types/websocket";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
const listeners: Map<WSEventType, ((message: WSMessage) => void)> = new Map();
let onConnectionChange: ((connected: boolean) => void) | null = null;

function notifyConnectionChange(connected: boolean): void {
  onConnectionChange?.(connected);
}

export function initWebSocket(
  onMessage: (message: WSMessage) => void,
  onStatusChange?: (connected: boolean) => void
): void {
  if (onStatusChange) {
    onConnectionChange = onStatusChange;
  }

  if (websocket?.readyState === WebSocket.OPEN) {
    return;
  }

  websocket = new WebSocket(WS_URL);

  websocket.onopen = () => {
    console.log("WebSocket connected");
    notifyConnectionChange(true);
  };

  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WSMessage;
      onMessage(message);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  websocket.onclose = () => {
    console.log("WebSocket disconnected, attempting reconnection...");
    notifyConnectionChange(false);
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
    websocket = null;
    initWebSocket((message) => {
      listeners.get(message.type)?.(message);
    });
  }, 3000);
}

export function subscribe(eventType: WSEventType, callback: (message: WSMessage) => void): void {
  listeners.set(eventType, callback);
}

export function unsubscribe(eventType: WSEventType): void {
  listeners.delete(eventType);
}

export function sendOrderPlaced(message: WSOrderPlaced): void {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message));
  }
}

export function disconnect(): void {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}