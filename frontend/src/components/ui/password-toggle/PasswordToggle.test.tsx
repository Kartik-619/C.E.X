import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordToggle } from "./PasswordToggle";

describe("PasswordToggle", () => {
  it("labels itself as a show-password control when hidden", () => {
    render(<PasswordToggle show={false} onToggle={() => {}} />);
    const button = screen.getByRole("button", { name: "Show password" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("tabindex", "-1");
  });

  it("labels itself as a hide-password control when visible", () => {
    render(<PasswordToggle show onToggle={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Hide password" })
    ).toBeInTheDocument();
  });

  it("uses a custom label", () => {
    render(<PasswordToggle show={false} onToggle={() => {}} label="confirm password" />);
    expect(
      screen.getByRole("button", { name: "Show confirm password" })
    ).toBeInTheDocument();
  });

  it("fires onToggle on click", async () => {
    const onToggle = vi.fn();
    render(<PasswordToggle show={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
