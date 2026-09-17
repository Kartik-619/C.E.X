"use client";

import React from "react";
import { toast } from "react-toastify";
import type { BalanceResponse } from "@/types/api";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { depositSchema, firstFieldErrors } from "@/utils/schemas";

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

interface DepositFormProps {
  onDeposit: (amount: number, asset?: string) => Promise<BalanceResponse | null>;
  depositing: boolean;
  error?: string | null;
}

export const DepositForm: React.FC<DepositFormProps> = ({ onDeposit, depositing, error }) => {
  const [amount, setAmount] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = depositSchema.safeParse({ amount });
    if (!result.success) {
      setFieldErrors(firstFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    const parsed = parseFloat(amount);
    const depositResult = await onDeposit(parsed, "USD");
    if (depositResult) {
      setAmount("");
      const formatted = parsed.toLocaleString("en-US", { style: "currency", currency: "USD" });
      toast.success(`Added ${formatted} to your wallet`);
    }
  };

  const handlePreset = (value: number) => {
    clearFieldError("amount");
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

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
          onChange={(v) => {
            setAmount(v);
            clearFieldError("amount");
          }}
          disabled={depositing}
          min="0.01"
          step="0.01"
          error={fieldErrors.amount}
        />

        {!fieldErrors.amount && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button type="submit" disabled={depositing || !amount} className="w-full">
          {depositing ? "Adding..." : "Add USD"}
        </Button>
      </form>
    </section>
  );
};
