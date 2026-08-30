import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("applies the primary variant by default", () => {
    render(<Button>Go</Button>);
    const button = screen.getByRole("button", { name: /go/i });
    expect(button.className).toContain("bg-zinc-900");
  });

  it("is disabled when the disabled prop is set and does not fire onClick", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Send
      </Button>
    );
    const button = screen.getByRole("button", { name: /send/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onClick on click", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Hit</Button>);
    await userEvent.click(screen.getByRole("button", { name: /hit/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses the submit type when specified", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button", { name: /save/i })).toHaveAttribute(
      "type",
      "submit"
    );
  });
});
