import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { OrderBook } from "./OrderBook";

vi.mock("@/services/api", () => ({
  getOrderBook: vi.fn(),
  getBalance: vi.fn(),
  placeOrder: vi.fn(),
  addPassiveOrder: vi.fn(),
  cancelOrder: vi.fn(),
}));

vi.mock("@/services/websocket", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

import { getOrderBook } from "@/services/api";

const mockedGetOrderBook = vi.mocked(getOrderBook);

const mockOrderBook = {
  bids: [
    { price: 48000, quantity: 2 },
    { price: 47900, quantity: 1 },
  ],
  asks: [{ price: 48100, quantity: 3 }],
  reducedTotalBidQuantity: 3,
  reducedTotalAskQuantity: 3,
  timestamp: new Date().toISOString(),
};

describe("OrderBook", () => {
  it("shows a loading state while fetching", () => {
    mockedGetOrderBook.mockReturnValue(new Promise(() => {}));
    render(<OrderBook />);
    expect(screen.getByText("Order Book")).toBeInTheDocument();
  });

  it("renders bids and asks after loading", async () => {
    mockedGetOrderBook.mockResolvedValue(mockOrderBook);
    render(<OrderBook />);

    expect(await screen.findByText(/48,000\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/48,100\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/bid depth/i)).toBeInTheDocument();
    expect(screen.getByText(/ask depth/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it("renders an error state when the request fails", async () => {
    mockedGetOrderBook.mockRejectedValue(new Error("Failed to fetch order book"));
    render(<OrderBook />);

    expect(await screen.findByText(/failed to fetch order book/i)).toBeInTheDocument();
  });

  it("retries the request when the retry action is clicked", async () => {
    mockedGetOrderBook.mockRejectedValueOnce(new Error("Failed to fetch order book"));
    mockedGetOrderBook.mockResolvedValue(mockOrderBook);
    render(<OrderBook />);

    expect(await screen.findByText(/failed to fetch order book/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText(/48,000\.00/i)).toBeInTheDocument();
  });

  it("shows an empty state when the book has no bids or asks", async () => {
    mockedGetOrderBook.mockResolvedValue({
      bids: [],
      asks: [],
      reducedTotalBidQuantity: 0,
      reducedTotalAskQuantity: 0,
      timestamp: new Date().toISOString(),
    });
    render(<OrderBook />);

    expect(await screen.findByText(/no orders in the market/i)).toBeInTheDocument();
  });
});
