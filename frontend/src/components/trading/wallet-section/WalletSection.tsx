"use client";

import React from "react";
import { useBalance } from "@/hooks/useBalance";
import { BalanceDisplayView } from "@/components/trading/balance-display/BalanceDisplayView";
import { DepositForm } from "@/components/trading/deposit-form/DepositForm";

interface WalletSectionProps {
  userId: string;
}

export const WalletSection: React.FC<WalletSectionProps> = ({ userId }) => {
  const { balance, loading, error, refetch, deposit, depositing } = useBalance(userId);

  return (
    <div className="space-y-5">
      <BalanceDisplayView
        balance={balance}
        loading={loading}
        error={error}
        refetch={refetch}
      />
      <DepositForm onDeposit={deposit} depositing={depositing} error={error} />
    </div>
  );
};
