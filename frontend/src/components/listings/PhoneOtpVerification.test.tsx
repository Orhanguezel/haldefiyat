import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "@/lib/api-client";
import { PhoneOtpVerification } from "./PhoneOtpVerification";

vi.mock("@/lib/api-client", () => ({
  apiPost: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PhoneOtpVerification", () => {
  it("announces send, wait and successful verification states", async () => {
    vi.mocked(apiPost)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ token: "signed-otp-token", phone: "+905321234567" });
    const onVerified = vi.fn();
    render(<PhoneOtpVerification phone="0532 123 45 67" onVerified={onVerified} />);

    fireEvent.click(screen.getByRole("button", { name: "Kod gönder" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Kod 5 dakika geçerlidir");
    expect(screen.getByRole("button", { name: /Yeniden kod gönderme için 60 saniye bekleyin/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("SMS kodu"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Kodu doğrula" }));

    await waitFor(() => expect(onVerified).toHaveBeenLastCalledWith("signed-otp-token"));
    expect(screen.getByText("Doğrulandı")).toBeInTheDocument();
    expect(apiPost).toHaveBeenNthCalledWith(1, "/listings/otp/send", { phone: "0532 123 45 67" });
    expect(apiPost).toHaveBeenNthCalledWith(2, "/listings/otp/verify", { phone: "0532 123 45 67", code: "123456" });
  });
});
