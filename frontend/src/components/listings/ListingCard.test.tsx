import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/lib/api";

const listing: Listing = {
  id: 42,
  slug: "domates-antalya-42",
  listingType: "satis",
  partyRole: "uretici",
  productSlug: "domates",
  productName: "Domates",
  categorySlug: "sebze",
  title: "10 kasa domates",
  description: "Günlük hasat",
  quantity: "10.00",
  quantityUnit: "kasa",
  priceType: "sabit",
  priceMin: "500.00",
  priceMax: null,
  priceUnit: "kasa",
  citySlug: "antalya",
  districtSlug: "kepez",
  contactName: "Kişisel İsim",
  contactPhone: "0555 111 22 33",
  phoneVerified: 1,
  hidePhone: 1,
  callRequestsEnabled: 1,
  callAvailability: ["asap"],
  validUntil: "2026-08-30",
  status: "approved",
  isSuspicious: 0,
  isFeatured: 1,
  featuredUntil: "2026-08-20T12:00:00.000Z",
  viewCount: 0,
  createdAt: "2026-08-14T08:00:00.000Z",
  images: [],
};

afterEach(cleanup);

describe("ListingCard", () => {
  it("keeps personal contact data out and exposes the primary detail action", () => {
    render(<ListingCard item={listing} />);

    expect(screen.queryByText("Kişisel İsim")).not.toBeInTheDocument();
    expect(screen.queryByText("0555 111 22 33")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "İlanı incele" })).toHaveAttribute("href", "/ilan/domates-antalya-42");
    expect(screen.getByText("10.00 kasa")).toBeInTheDocument();
    expect(screen.getByText("500.00 TL/kasa")).toBeInTheDocument();
  });

  it("explains phone verification and clearly marks a featured placement as sponsored", () => {
    render(<ListingCard item={listing} />);

    expect(screen.getByText("Reklam · Sponsorlu")).toBeInTheDocument();
    const verification = screen.getByRole("button", { name: "Telefon doğrulandı" });
    expect(verification).toHaveAttribute("aria-describedby", "listing-verification-42");
    expect(screen.getByRole("tooltip")).toHaveTextContent("kimlik veya ticari yetki doğrulaması değildir");
  });
});
