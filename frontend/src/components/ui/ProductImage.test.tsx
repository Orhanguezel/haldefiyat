import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProductImage from "./ProductImage";

afterEach(cleanup);

describe("ProductImage", () => {
  it("renders a stable accessible fallback when no photo exists", () => {
    render(<ProductImage slug="foto-olmayan-test-urunu" name="Test Ürünü" size={48} />);

    const fallback = screen.getByRole("img", { name: "Test Ürünü için ürün fotoğrafı bulunmuyor" });
    expect(fallback).toHaveStyle({ width: "48px", height: "48px" });
  });

  it("declares the fixed responsive size for a known product photo", () => {
    render(<ProductImage slug="acur" name="Acur" size={80} />);

    expect(screen.getByRole("img", { name: "Acur ürün görseli" })).toHaveAttribute("sizes", "80px");
  });
});
