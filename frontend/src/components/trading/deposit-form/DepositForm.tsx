"use client";

import React from "react";
import type { BalanceResponse } from "@/types/api";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";

interface DepositFormProps {
  onDeposit: (amount: number, asset?: string) => Promise<BalanceResponse | null>;
  depositing: boolean;
  error?: string | null;
}

export const DepositForm: React.FC<DepositFormProps> = ({ onDeposit, depositing, error }) => {
  const [amount, setAmount] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    const parsed = parseFloat(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      setFormError("Enter an amount greater than 0");
      return;
    }

    const result = await onDeposit(parsed, "USD");
    if (result) {
      setAmount("");
      setSuccess(`Added ${parsed.toLocaleString("en-US", { style: "currency", currency: "USD" })} to your wallet`);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Add Funds</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Deposit USD into your wallet
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="number"
          label="Amount (USD)"
          placeholder="100.00"
          value={amount}
          onChange={setAmount}
          disabled={depositing}
          min="0.01"
          step="0.01"
        />

        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        )}

        {!formError && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        )}

        <Button type="submit" disabled={depositing || !amount} className="w-full">
          {depositing ? "Adding..." : "Add USD"}
        </Button>
      </form>
    </section>
  );
};
