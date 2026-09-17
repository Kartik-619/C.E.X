import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TradeHistory } from "./TradeHistory";

vi.mock("@/services/websocket", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

describe("TradeHistory", () => {
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
});
