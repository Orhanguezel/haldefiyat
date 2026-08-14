import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "./ContactForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Adınız Soyadınız/), { target: { value: "Test Kullanıcı" } });
  fireEvent.change(screen.getByLabelText(/E-posta Adresi/), { target: { value: "test@example.com" } });
  fireEvent.change(screen.getByLabelText(/Telefon Numarası/), { target: { value: "05550000000" } });
  fireEvent.change(screen.getByLabelText(/Konu/), { target: { value: "Veri düzeltme" } });
  fireEvent.change(screen.getByLabelText(/Mesajınız/), { target: { value: "Kontrol talebi" } });
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("ContactForm", () => {
  it("sends explicit privacy consent and shows a safe success message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm />);

    fillRequiredFields();
    fireEvent.submit(screen.getByRole("button", { name: /Mesajı Gönder/ }).closest("form")!);

    await screen.findByRole("status");
    expect(screen.getByText(/Mesajınız inceleme sırasına alındı/)).toBeInTheDocument();
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      email: "test@example.com",
      privacyAccepted: true,
    });
  });

  it("does not expose a raw server error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "database_password_leaked" }),
    }));
    render(<ContactForm />);

    fillRequiredFields();
    fireEvent.submit(screen.getByRole("button", { name: /Mesajı Gönder/ }).closest("form")!);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Mesaj şu anda gönderilemedi"));
    expect(screen.queryByText(/database_password_leaked/)).not.toBeInTheDocument();
  });
});
