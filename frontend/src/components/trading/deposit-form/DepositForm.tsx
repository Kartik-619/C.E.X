"use client";

import React from "react";
import type { BalanceResponse } from "@/types/api";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

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
      setSuccess(
        `Added ${parsed.toLocaleString("en-US", { style: "currency", currency: "USD" })} to your wallet`
      );
    }
  };

  const handlePreset = (value: number) => {
    setFormError(null);
    setSuccess(null);
    setAmount(value.toString());
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
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              disabled={depositing}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                amount === preset.toString()
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              }`}
            >
              ${preset.toLocaleString()}
            </button>
          ))}
        </div>

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
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
            <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
          </div>
        )}

        <Button type="submit" disabled={depositing || !amount} className="w-full">
          {depositing ? "Adding..." : "Add USD"}
        </Button>
      </form>
    </section>
  );
};
