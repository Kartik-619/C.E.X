"use client";

import { useState, useEffect, useCallback } from "react";
import type { WSMessage, WSEventType, WSOrderPlaced } from "@/types/websocket";
import {
  initWebSocket,
  subscribe as subscribeService,
  unsubscribe as unsubscribeService,
  disconnect as disconnectService,
  sendOrderPlaced as sendOrderPlacedService,
} from "@/services/websocket";

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<WSMessage | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleMessage = (msg: WSMessage) => {
      if (cancelled) return;
      setMessage(msg);
    };

    const handleStatus = (isConnected: boolean) => {
      if (cancelled) return;
      setConnected(isConnected);
    };

    initWebSocket(handleMessage, handleStatus);

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback((eventType: WSEventType, callback: (msg: WSMessage) => void) => {
    subscribeService(eventType, callback);
  }, []);

  const unsubscribe = useCallback((eventType: WSEventType) => {
    unsubscribeService(eventType);
  }, []);

  const sendOrder = useCallback((order: WSOrderPlaced) => {
    sendOrderPlacedService(order);
  }, []);

  const disconnect = useCallback(() => {
    disconnectService();
    setConnected(false);
  }, []);

  return { connected, message, subscribe, unsubscribe, sendOrder, disconnect };
}
