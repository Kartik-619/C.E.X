import React, { createContext, useContext, ReactNode } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { WSEventType, WSMessage, WSOrderPlaced } from "../types/websocket";

export const UserContext = createContext<{
  userId: string | null;
  setUserId: (id: string) => void;
} | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = React.useState<string | null>(null);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

export const WebSocketContext = createContext<{
  connected: boolean;
  message: WSMessage | null;
  subscribe: (eventType: WSEventType, callback: (msg: WSMessage) => void) => void;
  unsubscribe: (eventType: WSEventType) => void;
  sendOrder: (order: WSOrderPlaced) => void;
  disconnect: () => void;
} | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { connected, message, subscribe, unsubscribe, sendOrder, disconnect } = useWebSocket();

  return (
    <WebSocketContext.Provider value={{ connected, message, subscribe, unsubscribe, sendOrder, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}