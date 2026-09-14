import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductListingsContent } from "./ProductListings";
import { fetchListings } from "@/lib/api";
vi.mock("@/lib/api", () => ({ fetchListings: vi.fn() }));
vi.mock("./ListingCard", () => ({ ListingCard: ({ item }: { item: { title: string } }) => <article>{item.title}</article> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("ProductListings", () => {
  it("requests only the current product and keeps the same filter on the all-listings link", async () => {
    vi.mocked(fetchListings).mockResolvedValue({ items: [{ id: 49, title: "Domates ilanı" }] as never[], meta: { total: 1, page: 1, limit: 6 } });
    render(await ProductListingsContent({ productSlug: "domates", productName: "Domates" }));
    expect(fetchListings).toHaveBeenCalledWith({ product: "domates", limit: 6 });
    expect(screen.getByRole("link", { name: /Tümünü gör/ })).toHaveAttribute("href", "/ilanlar?product=domates");
    expect(screen.getByText("Domates ilanı")).toBeInTheDocument();
  });
  it("keeps a variety-specific empty state instead of substituting another product", async () => {
    vi.mocked(fetchListings).mockResolvedValue({ items: [], meta: { total: 0, page: 1, limit: 6 } });
    render(await ProductListingsContent({ productSlug: "domates-salcalik", productName: "Salçalık domates" }));
    expect(fetchListings).toHaveBeenCalledWith({ product: "domates-salcalik", limit: 6 });
    expect(screen.getByRole("link", { name: "Ücretsiz ilan ver" })).toHaveAttribute("href", "/ilan-ver?product=domates-salcalik");
    expect(screen.queryByRole("link", { name: /Tümünü gör/ })).not.toBeInTheDocument();
  });
});
