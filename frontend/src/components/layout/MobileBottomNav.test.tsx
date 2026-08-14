import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileBottomNav } from "./MobileBottomNav";

let pathname = "/fiyatlar";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  pathname = "/fiyatlar";
});

describe("MobileBottomNav", () => {
  it("has an accessible landmark, safe-area padding and one current page", () => {
    render(<MobileBottomNav locale="tr" />);

    const nav = screen.getByRole("navigation", { name: "Mobil navigasyon" });
    expect(nav.className).toContain("safe-area-inset-bottom");
    expect(screen.getByRole("link", { name: "Fiyatlar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("keeps the localized home route active", () => {
    pathname = "/tr";
    render(<MobileBottomNav locale="tr" />);

    expect(screen.getByRole("link", { name: "Anasayfa" })).toHaveAttribute("aria-current", "page");
  });
});
