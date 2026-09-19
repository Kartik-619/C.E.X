import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TradeHistory } from "./TradeHistory";
import { getTradeHistory } from "@/services/api";

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/services/api", () => ({
  getTradeHistory: vi.fn(),
  getTicks: vi.fn(),
}));

vi.mock("@/services/websocket", () => ({
  subscribe: (...args: unknown[]) => mockSubscribe(...args),
  unsubscribe: (...args: unknown[]) => mockUnsubscribe(...args),
}));

vi.mock("@/context/UserContext", () => ({
  useAuth: () => ({ user: { id: "user-1234" } }),
}));

import type { WSMessage } from "@/types/websocket";
import type { MarketTrade } from "@/types/api";

const mockGetTradeHistory = vi.mocked(getTradeHistory);

function marketTrade(overrides: Partial<MarketTrade> = {}): MarketTrade {
  return {
    tradeId: "seed-trade-1",
    symbol: "BTC/USD",
    price: 48000,
    quantity: 0.5,
    totalValue: 24000,
    timestamp: "2026-09-18T10:00:00.000Z",
    buyerId: "alice",
    sellerId: "bob",
    side: null,
    ...overrides,
  };
}

function tradeMessage(overrides: Partial<Record<string, unknown>>): WSMessage {
  return {
    type: "TRADE_EXECUTED",
    data: {
      tradeId: "trade-1",
      buyOrderId: 101,
      sellOrderId: 202,
      buyerId: "user-1234",
      sellerId: "bob",
      symbol: "BTC/USD",
      price: 48000,
      quantity: 0.5,
      totalValue: 24000,
      timestamp: 1700000000000,
      ...overrides,
    },
  } as WSMessage;
}

describe("TradeHistory", () => {
  beforeEach(() => {
    mockSubscribe.mockReset();
    mockUnsubscribe.mockReset();
    mockGetTradeHistory.mockReset();
  });

  it("renders a loading placeholder while fetching", () => {
    mockGetTradeHistory.mockImplementation(
      () => new Promise(() => { /* never resolves */ })
    );
    render(<TradeHistory />);
    expect(screen.getByText("Recent Trades")).toBeInTheDocument();
  });

  it("shows an error state when the feed fails to load", async () => {
    mockGetTradeHistory.mockRejectedValue(new Error("boom"));
    render(<TradeHistory />);

    expect(await screen.findByText(/couldn't load trade history/i)).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("shows an empty state when there are no trades", async () => {
    mockGetTradeHistory.mockResolvedValue([]);
    render(<TradeHistory />);

    expect(await screen.findByText(/no trades yet/i)).toBeInTheDocument();
  });

  it("renders the market feed and marks unrelated trades as neutral", async () => {
    mockGetTradeHistory.mockResolvedValue([
      marketTrade({ buyerId: "alice", sellerId: "bob", side: null }),
    ]);
    render(<TradeHistory />);

    expect(await screen.findByText("48,000.00")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("BUY")).not.toBeInTheDocument();
    expect(screen.queryByText("SELL")).not.toBeInTheDocument();
  });

  it("marks a feed trade as BUY when the user is the buyer", async () => {
    mockGetTradeHistory.mockResolvedValue([]);
    mockSubscribe.mockImplementation((event: string, cb: (msg: WSMessage) => void) => {
      if (event === "TRADE_EXECUTED") cb(tradeMessage({}));
    });
    render(<TradeHistory />);

    expect(await screen.findByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("48,000.00")).toBeInTheDocument();
    expect(screen.queryByText("SELL")).not.toBeInTheDocument();
  });

  it("marks a feed trade as SELL when the user is the seller", async () => {
    mockGetTradeHistory.mockResolvedValue([]);
    mockSubscribe.mockImplementation((event: string, cb: (msg: WSMessage) => void) => {
      if (event === "TRADE_EXECUTED")
        cb(tradeMessage({ buyerId: "alice", sellerId: "user-1234" }));
    });
    render(<TradeHistory />);

    expect(await screen.findByText("SELL")).toBeInTheDocument();
    expect(screen.queryByText("BUY")).not.toBeInTheDocument();
  });

  it("unsubscribes from the live feed on unmount", () => {
    mockGetTradeHistory.mockResolvedValue([]);
    const { unmount } = render(<TradeHistory />);
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      "TRADE_EXECUTED",
      expect.any(Function)
    );
  });
});