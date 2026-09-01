"use client";

import React from "react";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { AuthProvider } from "@/context/UserContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
    </AuthProvider>
  );
};
