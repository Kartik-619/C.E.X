"use client";

import React from "react";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { UserProvider } from "@/context/UserContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <UserProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
    </UserProvider>
  );
};
