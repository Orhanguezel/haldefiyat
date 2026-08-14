import { describe, expect, it } from "vitest";
import { sourceInfoFor } from "@/config/source-urls";

describe("sourceInfoFor", () => {
  it("uses market metadata and configured base URL for uncatalogued ETL sources", () => {
    const source = sourceInfoFor("bursa_resmi", "hal", "Bursa Büyükşehir Belediyesi Hali");
    expect(source?.name).toBe("Bursa Büyükşehir Belediyesi Hali");
    expect(source?.url).toBe("https://www.bursa.bel.tr");
  });

  it("does not return a raw key as a public source name", () => {
    const source = sourceInfoFor("tobb_borsa_ankara", "borsa");
    expect(source?.name).toBe("Ankara Ticaret Borsası");
    expect(source?.name).not.toContain("_");
  });
});
