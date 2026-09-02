import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiAccessPanel from "./ApiAccessPanel";

const { apiGetMock } = vi.hoisted(() => ({ apiGetMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/providers/AuthSessionProvider", () => ({
  useAuthSession: () => ({
    loading: false,
    user: {
      id: "member-1",
      full_name: "Ayşe Üye",
      email: "ayse@example.com",
      phone: "+49 172 123 45 67",
      email_verified: 1,
      is_active: 1,
      ecosystem_id: null,
      role: "user",
    },
  }),
}));

vi.mock("@/lib/api-client", () => ({
  apiGet: apiGetMock,
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

afterEach(cleanup);

describe("ApiAccessPanel", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiGetMock.mockImplementation((path: string) => {
      if (path === "/keys") return Promise.resolve({ items: [] });
      return Promise.resolve({
        configured: false,
        tier: "free",
        subscription: null,
        priceMonthlyTL: 99,
        dailyLimit: 100,
      });
    });
  });

  it("opens the Pro request inside the account page with member data", async () => {
    render(<ApiAccessPanel locale="tr" />);

    const openButton = await screen.findByRole("button", { name: "Pro talebi gönder" });
    expect(screen.queryByText("Pro plan talebi")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pro talebi gönder" })).not.toBeInTheDocument();

    fireEvent.click(openButton);

    expect(openButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Pro plan talebi")).toBeInTheDocument();
    expect(screen.getByLabelText(/Adınız Soyadınız/)).toHaveValue("Ayşe Üye");
    expect(screen.getByLabelText(/E-posta Adresi/)).toHaveValue("ayse@example.com");
    expect(screen.getByLabelText(/Telefon Numarası/)).toHaveValue("+49 172 123 45 67");
    expect(screen.getByLabelText(/Konu/)).toHaveValue("Pro Plan Talebi");
  });
});
