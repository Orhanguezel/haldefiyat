import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ApiProductNav from "./ApiProductNav";

afterEach(cleanup);

describe("ApiProductNav", () => {
  it("connects the product funnel while preserving newsletter semantics", () => {
    render(<ApiProductNav current="/pro" />);

    expect(screen.getByRole("link", { name: "API Pro" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dokümantasyon" })).toHaveAttribute("href", "/api-docs");
    expect(screen.getByRole("link", { name: "Kullanım politikası" })).toHaveAttribute("href", "/api-policy");
    expect(screen.getByRole("link", { name: "Bülten aboneliği" })).toHaveAttribute("href", "/abonelik");
  });
});
