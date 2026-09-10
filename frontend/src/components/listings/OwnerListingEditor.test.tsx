import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Listing } from "@/lib/api";
import { apiPatch } from "@/lib/api-client";
import { OwnerListingEditor } from "./OwnerListingEditor";
vi.mock("@/lib/api-client", () => ({ apiPatch: vi.fn() }));
vi.mock("@/components/firms/owner/CityDistrictSelect", () => ({ CityDistrictSelect: () => null }));
const item = { id: 36, title: "Mürdüm eriği", description: "Erik", quantity: "100", quantityUnit: "kg", priceMin: "25.00", priceMax: null, priceType: "sabit", priceUnit: "kg", validUntil: "2020-01-01", images: ["/first.webp", "/second.webp"], citySlug: "afyonkarahisar", districtSlug: null } as Listing;
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("persists a new cover without extending the existing offer deadline", async () => {
  vi.mocked(apiPatch).mockResolvedValue({});
  const saved = vi.fn();
  render(<OwnerListingEditor item={item} onSaved={saved} onCancel={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Kapak yap" }));
  fireEvent.submit(screen.getByRole("form", { name: "İlanı düzenle" }));
  await waitFor(() => expect(apiPatch).toHaveBeenCalledWith("/listings/36", { images: ["/second.webp", "/first.webp"] }));
  expect(saved).toHaveBeenCalledOnce();
});
it("keeps the editor open and preserves edits when saving fails", async () => {
  vi.mocked(apiPatch).mockRejectedValue(new Error("offline"));
  const saved = vi.fn();
  render(<OwnerListingEditor item={item} onSaved={saved} onCancel={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Fotoğraf 1 kaldır" }));
  fireEvent.submit(screen.getByRole("form", { name: "İlanı düzenle" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("kaydedilemedi");
  expect(saved).not.toHaveBeenCalled();
  expect(screen.getAllByRole("img")).toHaveLength(1);
});
