import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("renders the title and description", () => {
    render(
      <ErrorState title="Couldn't load data" description="Something went wrong." />
    );
    expect(screen.getByText("Couldn't load data")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("fires onRetry when the retry action is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Couldn't load data" retryLabel="Try again" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});