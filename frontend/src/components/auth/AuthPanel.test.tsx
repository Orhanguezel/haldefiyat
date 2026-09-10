import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthPanel } from "./AuthPanel";
const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), signup: vi.fn(), login: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }), useSearchParams: () => new URLSearchParams(mocks.query) }));
vi.mock("@/lib/auth", () => ({ fetchGoogleAuthConfig: async () => ({ enabled: false }), isApiError: () => false, loginWithEmail: mocks.login, signupWithEmail: mocks.signup }));
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.query = ""; });
describe("mobile account entry", () => {
  it("preserves the listing destination when switching to registration", () => {
    mocks.query = "next=%2Filan-ver";
    render(<AuthPanel locale="tr" mode="login" />);
    expect(screen.getByRole("link", { name: "Hesabın yok mu? Kayıt ol" })).toHaveAttribute("href", "/kayit?next=%2Filan-ver");
  });
  it("registers without a phone and sends the member to their account", async () => {
    render(<AuthPanel locale="tr" mode="register" />);
    expect(screen.getByLabelText("Telefon (isteğe bağlı)")).not.toBeRequired();
    fireEvent.change(screen.getByLabelText(/Ad Soyad/), { target: { value: "QA User" } });
    fireEvent.change(screen.getByLabelText(/E-posta/), { target: { value: "qa@example.invalid" } });
    fireEvent.change(screen.getByLabelText(/Parola/), { target: { value: "qa-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/hesabim"));
    expect(mocks.signup).toHaveBeenCalledWith(expect.objectContaining({ phone: "", email: "qa@example.invalid" }));
  });
  it("lets the user check their password and returns them to their listing", async () => {
    mocks.query = "next=%2Filan-ver";
    render(<AuthPanel locale="tr" mode="login" />);
    fireEvent.change(screen.getByLabelText(/E-posta/), { target: { value: "qa@example.invalid" } });
    const password = screen.getByLabelText(/Parola/);
    fireEvent.change(password, { target: { value: "qa-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Parolayı göster" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/ilan-ver"));
  });
});
