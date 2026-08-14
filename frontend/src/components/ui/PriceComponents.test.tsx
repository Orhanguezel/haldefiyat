import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PriceRow } from "@/lib/api";
import FreshnessBadge from "./FreshnessBadge";
import PriceCard from "./PriceCard";
import PriceTable from "./PriceTable";

vi.mock("next/navigation", () => ({
  usePathname: () => "/fiyatlar",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/ui/ProductImage", () => ({
  default: ({ name }: { name: string }) => <span role="img" aria-label={`${name} ürün görseli`} />,
}));
vi.mock("@/components/ui/FavoriteButton", () => ({
  default: ({ productName }: { productName: string }) => <button type="button">{productName} favori</button>,
}));

const row: PriceRow = {
  id: 1,
  minPrice: 20,
  maxPrice: 40,
  avgPrice: 30,
  avgPriceMethod: "midpoint",
  isSynthetic: true,
  currency: "TRY",
  unit: "kasa",
  recordedDate: "2026-08-14",
  sourceApi: "izmir_sebzemeyve",
  sourceName: "İzmir Büyükşehir Belediyesi",
  productSlug: "domates-kasa",
  canonicalProduct: "domates",
  productName: "Domates (Kasa)",
  categorySlug: "sebze",
  marketSlug: "izmir-hal",
  marketName: "İzmir Hali",
  cityName: "İzmir",
};

afterEach(cleanup);

describe("price UI components", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T12:00:00Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("shows unit, source, date, synthetic method and a non-color trend marker", () => {
    render(<PriceCard row={row} changePct={4.2} />);

    expect(screen.getByRole("link", { name: "Domates (Kasa)" })).toHaveAttribute("href", "/urun/domates");
    expect(screen.getByText("/kasa")).toBeInTheDocument();
    expect(screen.getByText("▲ Yükseliş")).toBeInTheDocument();
    expect(screen.getByText(/Min–maks orta noktası/)).toBeInTheDocument();
    expect(screen.getByText("İzmir Büyükşehir Belediyesi")).toBeInTheDocument();
  });

  it("renders accessible filters and filters the price table", () => {
    render(<PriceTable initialPrices={[row]} markets={[]} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Ürün ara" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Şehir" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Ürün" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Ürün ara" }), { target: { value: "elma" } });
    expect(screen.getByText("Filtrelere uyan kayıt bulunamadı.")).toBeInTheDocument();
  });

  it("labels fresh and historical records without relying on color", () => {
    const { rerender } = render(<FreshnessBadge recordedDate="2026-08-14" />);
    expect(screen.getByText("Bugün güncellendi")).toBeInTheDocument();

    rerender(<FreshnessBadge recordedDate="2026-06-01" />);
    expect(screen.getByText(/Geçen sezon verisi/)).toBeInTheDocument();
    expect(screen.getByText(/1 Haziran 2026 tarihli veri/)).toBeInTheDocument();
  });
});
