import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileBottomNav } from "./MobileBottomNav";

let user: { id: string } | null = null;
vi.mock("@/components/providers/AuthSessionProvider", () => ({ useAuthSession: () => ({ user }) }));

let pathname = "/fiyatlar";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  user = null;
  pathname = "/fiyatlar";
});

describe("MobileBottomNav", () => {
  it("has an accessible landmark, safe-area padding and one current page", () => {
    render(<MobileBottomNav locale="tr" />);

    const nav = screen.getByRole("navigation", { name: "Mobil navigasyon" });
    expect(nav.className).toContain("safe-area-inset-bottom");
    expect(screen.getByRole("link", { name: "Fiyatlar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("offers account and listing access for guests and members", () => {
    const { rerender } = render(<MobileBottomNav locale="tr" />);
    expect(screen.getByRole("link", { name: "Giriş" })).toHaveAttribute("href", "/giris");
    expect(screen.getByRole("link", { name: "İlan ver" })).toHaveAttribute("href", "/ilan-ver");
    user = { id: "qa" };
    pathname = "/hesabim/profil";
    rerender(<MobileBottomNav locale="tr" />);
    expect(screen.getByRole("link", { name: "Hesabım" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the localized home route active", () => {
    pathname = "/tr";
    render(<MobileBottomNav locale="tr" />);

    expect(screen.getByRole("link", { name: "Anasayfa" })).toHaveAttribute("aria-current", "page");
  });
});
