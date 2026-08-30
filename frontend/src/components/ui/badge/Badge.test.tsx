import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>BUY</Badge>);
    expect(screen.getByText("BUY")).toBeInTheDocument();
  });

  it("renders a span by default", () => {
    render(<Badge>neutral</Badge>);
    const badge = screen.getByText("neutral");
    expect(badge.tagName).toBe("SPAN");
  });

  it("applies the buy variant classes", () => {
    render(<Badge variant="buy">BUY</Badge>);
    expect(screen.getByText("BUY").className).toContain("bg-emerald-100");
  });

  it("renders a button and fires onClick when provided", async () => {
    const onClick = vi.fn();
    render(
      <Badge variant="neutral" onClick={onClick}>
        Clickable
      </Badge>
    );
    const badge = screen.getByRole("button", { name: /clickable/i });
    expect(badge.tagName).toBe("BUTTON");
    await userEvent.click(badge);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
