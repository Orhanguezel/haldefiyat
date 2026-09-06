import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListingForm } from "./ListingForm";

vi.mock("@/components/providers/AuthSessionProvider", () => ({
  useAuthSession: () => ({
    loading: false,
    user: {
      id: "test-user",
      email: "test@example.com",
      full_name: "Test Kullanıcı",
      phone: "0555 111 22 33",
    },
  }),
}));

vi.mock("@/components/firms/owner/CityDistrictSelect", () => ({
  CityDistrictSelect: () => <div>İl seçimi</div>,
}));

vi.mock("@/components/ui/SearchableSelect", () => ({
  SearchableSelect: () => <div>Ürün seçimi</div>,
}));

vi.mock("./PhoneOtpVerification", () => ({
  PhoneOtpVerification: () => null,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ListingForm image upload", () => {
  it("shows the user a visible error when the upload proxy returns 413", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({}),
    }));
    const { container } = render(<ListingForm products={[]} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File(["fasulye"], "fasulye.jpg", { type: "image/jpeg" });
    fireEvent.change(input!, { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "fasulye.jpg: Görsel 5 MB sınırını aşıyor.",
    );
    expect(screen.getByRole("button", { name: "İlanı gönder" })).toBeEnabled();
  });
});
