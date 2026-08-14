import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

const setTheme = vi.fn();
let resolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme, resolvedTheme }),
}));

afterEach(() => {
  cleanup();
  setTheme.mockClear();
  resolvedTheme = "light";
});

describe("ThemeToggle", () => {
  it("announces and applies the dark-theme action", async () => {
    render(<ThemeToggle />);
    const button = await screen.findByRole("button", { name: "Koyu temaya geç" });

    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("announces and applies the light-theme action", async () => {
    resolvedTheme = "dark";
    render(<ThemeToggle />);
    const button = await screen.findByRole("button", { name: "Açık temaya geç" });

    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
