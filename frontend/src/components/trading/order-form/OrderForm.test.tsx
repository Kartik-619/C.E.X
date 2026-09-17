import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderForm } from "./OrderForm";

vi.mock("@/services/api", () => ({
  placeOrder: vi.fn(),
  addPassiveOrder: vi.fn(),
  cancelOrder: vi.fn(),
  getBalance: vi.fn(),
  getOrderBook: vi.fn(),
}));

import { placeOrder } from "@/services/api";

const mockedPlaceOrder = vi.mocked(placeOrder);

const mockOrderResponse = {
  id: "order-1",
  userId: "user-1234",
  symbol: "BTC/USD",
  side: "buy" as const,
  price: 48000,
  quantity: 0.5,
  status: "pending" as const,
  totalValue: 24000,
  createdAt: new Date().toISOString(),
};

describe("OrderForm", () => {
  beforeEach(() => {
    mockedPlaceOrder.mockReset();
  });

  it("renders the form controls", () => {
    render(<OrderForm userId="user-1234" />);
    expect(screen.getByRole("button", { name: /^buy$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sell$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/symbol/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^limit$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^market$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buy btc/i })).toBeInTheDocument();
  });

  it("defaults to buy side and limit type", () => {
    render(<OrderForm userId="user-1234" />);
    const buyButton = screen.getByRole("button", { name: /^buy$/i });
    const limitButton = screen.getByRole("button", { name: /limit/i });
    expect(buyButton.className).toContain("bg-emerald-600");
    expect(limitButton.className).toContain("bg-zinc-900");
  });

  it("shows a validation error for an invalid quantity", async () => {
    render(<OrderForm userId="user-1234" />);
    await userEvent.type(screen.getByLabelText(/price/i), "48000");
    await userEvent.type(screen.getByLabelText(/quantity/i), "0");
    await userEvent.click(screen.getByRole("button", { name: /buy btc/i }));
    expect(await screen.findByText(/quantity must be greater than 0/i)).toBeInTheDocument();
    expect(mockedPlaceOrder).not.toHaveBeenCalled();
  });

  it("places a limit order through the API service on submit", async () => {
    mockedPlaceOrder.mockResolvedValue(mockOrderResponse);
    render(<OrderForm userId="user-1234" />);

    await userEvent.type(screen.getByLabelText(/price/i), "48000");
    await userEvent.type(screen.getByLabelText(/quantity/i), "0.5");
    await userEvent.click(screen.getByRole("button", { name: /buy btc/i }));

    await waitFor(() => {
      expect(mockedPlaceOrder).toHaveBeenCalledTimes(1);
    });
    expect(mockedPlaceOrder).toHaveBeenCalledWith({
      userId: "user-1234",
      symbol: "BTC/USD",
      side: "buy",
      price: 48000,
      quantity: 0.5,
      type: "LIMIT",
    });
  });

  it("sends a zero price for MARKET orders", async () => {
    mockedPlaceOrder.mockResolvedValue(mockOrderResponse);
    render(<OrderForm userId="user-1234" />);

    await userEvent.click(screen.getByRole("button", { name: /market/i }));
    await userEvent.type(screen.getByLabelText(/quantity/i), "1");
    await userEvent.click(screen.getByRole("button", { name: /buy btc/i }));

    await waitFor(() => {
      expect(mockedPlaceOrder).toHaveBeenCalledWith({
        userId: "user-1234",
        symbol: "BTC/USD",
        side: "buy",
        price: 0,
        quantity: 1,
        type: "MARKET",
      });
    });
  });

  it("displays an error returned by the API", async () => {
    mockedPlaceOrder.mockRejectedValue(new Error("Insufficient balance"));
    render(<OrderForm userId="user-1234" />);

    await userEvent.type(screen.getByLabelText(/price/i), "48000");
    await userEvent.type(screen.getByLabelText(/quantity/i), "0.5");
    await userEvent.click(screen.getByRole("button", { name: /buy btc/i }));

    expect(await screen.findByText(/insufficient balance/i)).toBeInTheDocument();
  });
});
