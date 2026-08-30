"use client";

import React from "react";
import type { OrderRequest } from "@/types/api";
import { useOrders } from "@/hooks/useOrders";
import { Input } from "@/components/ui/input/Input";
import { validateOrderRequest } from "@/utils/formatters";

export interface OrderFormProps {
  userId: string;
}

type Side = "buy" | "sell";
type OrderType = "LIMIT" | "MARKET";

interface FormState {
  symbol: string;
  side: Side;
  price: string;
  quantity: string;
  orderType: OrderType;
}

export const OrderForm: React.FC<OrderFormProps> = ({ userId }) => {
  const { placeLimitOrder, placeMarketOrder, loading, error } = useOrders();

  const [form, setForm] = React.useState<FormState>({
    symbol: "BTC/USD",
    side: "buy",
    price: "",
    quantity: "",
    orderType: "LIMIT",
  });
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleChange = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const request: OrderRequest = {
      userId,
      symbol: form.symbol,
      side: form.side,
      price: form.orderType === "MARKET" ? 0 : form.price ? parseFloat(form.price) : 0,
      quantity: form.quantity ? parseFloat(form.quantity) : 0,
      type: form.orderType,
    };

    const validationError = validateOrderRequest({
      price: request.price,
      quantity: request.quantity,
      side: request.side,
    });

    if (validationError) {
      setFormError(validationError);
      return;
    }

    let result;
    if (form.orderType === "MARKET") {
      result = await placeMarketOrder(userId, form.symbol, form.side, request.quantity);
    } else {
      result = await placeLimitOrder(
        userId,
        form.symbol,
        form.side,
        request.price,
        request.quantity
      );
    }

    if (result) {
      setForm((prev) => ({ ...prev, price: "", quantity: "" }));
    }
  };

  const sideClasses = (side: Side, active: Side) =>
    `flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
      form.side === active
        ? side === "buy"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    }`;

  const typeClass = (type: OrderType) =>
    `flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
      form.orderType === type
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    }`;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-base font-semibold">Place Order</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Side selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleChange("side", "buy")}
            className={sideClasses("buy", form.side)}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => handleChange("side", "sell")}
            className={sideClasses("sell", form.side)}
          >
            Sell
          </button>
        </div>

        {/* Symbol */}
        <Input
          type="text"
          label="Symbol"
          placeholder="BTC/USD"
          value={form.symbol}
          onChange={(v) => handleChange("symbol", v)}
          name="symbol"
        />

        {/* Order Type */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Order Type
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => handleChange("orderType", "LIMIT")} className={typeClass("LIMIT")}>
              Limit
            </button>
            <button type="button" onClick={() => handleChange("orderType", "MARKET")} className={typeClass("MARKET")}>
              Market
            </button>
          </div>
        </div>

        {/* Price (hidden for market) */}
        {form.orderType === "LIMIT" && (
          <Input
            type="number"
            label="Price"
            placeholder="48000.00"
            value={form.price}
            onChange={(v) => handleChange("price", v)}
            name="price"
            step="any"
          />
        )}

        <Input
          type="number"
          label="Quantity"
          placeholder="0.001"
          value={form.quantity}
          onChange={(v) => handleChange("quantity", v)}
          name="quantity"
          step="any"
        />

        {/* Estimated value */}
        {form.orderType === "LIMIT" && form.price && form.quantity && (
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
            Est. value:{" "}
            <span className="font-medium tabular-nums">
              ${(parseFloat(form.price) * parseFloat(form.quantity)).toFixed(2)}
            </span>
          </div>
        )}

        {(formError || error) && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {formError || error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-md py-3 text-sm font-semibold text-white transition-all ${
            form.side === "buy"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {loading
            ? "Placing..."
            : `${form.side === "buy" ? "Buy" : "Sell"} ${form.symbol.split("/")[0]}`}
        </button>
      </form>
    </section>
  );
};
