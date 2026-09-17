import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BalanceDisplay } from "./BalanceDisplay";

vi.mock("@/services/api", () => ({
  getBalance: vi.fn(),
  placeOrder: vi.fn(),
  addPassiveOrder: vi.fn(),
  cancelOrder: vi.fn(),
  getOrderBook: vi.fn(),
}));

import { getBalance } from "@/services/api";

const mockedGetBalance = vi.mocked(getBalance);

const mockBalance = {
  userId: "user-1234",
  asset: "BTC",
  available: 1.5,
  locked: 0.5,
  total: 2.0,
};

describe("BalanceDisplay", () => {
  it("renders a loading skeleton while the balance is fetching", () => {
    mockedGetBalance.mockReturnValue(new Promise(() => {}));
    const { container } = render(<BalanceDisplay userId="user-1234" />);
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("renders the account balance values", async () => {
    mockedGetBalance.mockResolvedValue(mockBalance);
    render(<BalanceDisplay userId="user-1234" />);

    await waitFor(() => {
      expect(screen.getAllByText(/2\.00/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/^Available$/)).toBeInTheDocument();
    expect(screen.getByText(/^Locked$/)).toBeInTheDocument();
  });

  it("renders an error state when the API request fails", async () => {
    mockedGetBalance.mockRejectedValue(new Error("Failed to fetch balance"));
    render(<BalanceDisplay userId="user-1234" />);

    expect(await screen.findByText(/failed to fetch balance/i)).toBeInTheDocument();
  });
});
