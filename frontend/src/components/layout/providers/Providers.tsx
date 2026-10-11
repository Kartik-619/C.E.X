"use client";

import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { AuthProvider, useAuth } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useWebSocketToasts } from "@/hooks/useWebSocketToasts";

function ToastListener() {
  const { user } = useAuth();
  useWebSocketToasts(user?.id ?? null);
  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <ToastListener />
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="colored"
          />
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
