import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TradeHistory } from "./TradeHistory";

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/services/websocket", () => ({
  subscribe: (...args: unknown[]) => mockSubscribe(...args),
  unsubscribe: (...args: unknown[]) => mockUnsubscribe(...args),
}));

vi.mock("@/context/UserContext", () => ({
  useAuth: () => ({ user: { id: "user-1234" } }),
}));

import type { WSMessage } from "@/types/websocket";

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
  });

  it("renders a loading placeholder while fetching", () => {
    render(<TradeHistory />);
    expect(screen.getByText("Trade History")).toBeInTheDocument();
  });

  it("shows an empty state when there are no trades", async () => {
    render(<TradeHistory />);
    expect(await screen.findByText(/no trades yet/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/no trades yet/i)).toBeInTheDocument();
    });
  });

  it("marks a trade as BUY when the user is the buyer", async () => {
    mockSubscribe.mockImplementation((event: string, cb: (msg: WSMessage) => void) => {
      if (event === "TRADE_EXECUTED") cb(tradeMessage({}));
    });
    render(<TradeHistory />);

    expect(await screen.findByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("48,000.00")).toBeInTheDocument();
    expect(screen.queryByText("SELL")).not.toBeInTheDocument();
  });

  it("marks a trade as SELL when the user is the seller", async () => {
    mockSubscribe.mockImplementation((event: string, cb: (msg: WSMessage) => void) => {
      if (event === "TRADE_EXECUTED")
        cb(tradeMessage({ buyerId: "alice", sellerId: "user-1234" }));
    });
    render(<TradeHistory />);

    expect(await screen.findByText("SELL")).toBeInTheDocument();
    expect(screen.queryByText("BUY")).not.toBeInTheDocument();
  });

  it("ignores trades that do not involve the current user", async () => {
    mockSubscribe.mockImplementation((event: string, cb: (msg: WSMessage) => void) => {
      if (event === "TRADE_EXECUTED")
        cb(tradeMessage({ buyerId: "alice", sellerId: "bob" }));
    });
    render(<TradeHistory />);

    await waitFor(() => {
      expect(screen.getByText(/no trades yet/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("48,000.00")).not.toBeInTheDocument();
  });
});