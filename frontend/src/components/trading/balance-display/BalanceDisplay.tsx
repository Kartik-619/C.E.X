"use client";

import React from "react";
import { useBalance } from "@/hooks/useBalance";
import { BalanceDisplayView } from "./BalanceDisplayView";

interface BalanceDisplayProps {
  userId?: string;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ userId = "alice" }) => {
  const { balance, loading, error, refetch } = useBalance(userId);

  return (
    <BalanceDisplayView
      balance={balance}
      loading={loading}
      error={error}
      refetch={refetch}
    />
  );
};
