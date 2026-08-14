import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import FirmCard from "./FirmCard";
import type { Firm } from "@/lib/api";

const firm: Firm = {
  id: 12,
  externalId: "firm-12",
  slug: "ornek-komisyoncu",
  name: "Örnek Komisyoncu",
  contactPerson: null,
  phone: "+903221112233",
  address: "Merkez Hal No: 12",
  citySlug: "adana",
  districtSlug: "seyhan",
  photoUrl: null,
  sourceUrl: "https://example.com/firm-12",
  firmType: "komisyoncu",
  categories: ["sebze"],
  claimStatus: "verified",
  sponsorshipTier: null,
};

afterEach(cleanup);

describe("FirmCard", () => {
  it("keeps the directory card concise and links to the singular detail route", () => {
    render(<FirmCard firm={firm} />);

    expect(screen.getByRole("link", { name: /Örnek Komisyoncu/ })).toHaveAttribute("href", "/firma/ornek-komisyoncu");
    expect(screen.getByText("Komisyoncu")).toBeInTheDocument();
    expect(screen.getByText("Adana · Seyhan")).toBeInTheDocument();
    expect(screen.getByText("Firmayı incele")).toBeInTheDocument();
    expect(screen.queryByText("+903221112233")).not.toBeInTheDocument();
  });

  it("explains the limited meaning of firm verification", () => {
    render(<FirmCard firm={firm} />);

    expect(screen.getByText("Doğrulanmış")).toHaveAttribute("title", expect.stringContaining("hizmet kalitesi garantisi değildir"));
  });
});
