import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import FirmContactPolicy from "./FirmContactPolicy";

afterEach(cleanup);

describe("FirmContactPolicy", () => {
  it("separates public business contacts from private listing seller data", () => {
    render(<FirmContactPolicy />);

    expect(screen.getByRole("heading", { name: "Firma iletişim bilgisi politikası" })).toBeInTheDocument();
    expect(screen.getByText(/ilan sahibinin özel numarası değil/)).toBeInTheDocument();
    expect(screen.getByText(/hizmet kalitesi ya da anlık erişilebilirlik garantisi/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "düzeltme bildirin" })).toHaveAttribute("href", expect.stringContaining("Firma%20ileti"));
  });
});
