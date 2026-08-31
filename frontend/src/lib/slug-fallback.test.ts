import { describe, expect, it } from "vitest";
import { resolveCanonicalFallback, stripNumericSuffix } from "./slug-fallback";

describe("stripNumericSuffix", () => {
  it("kopya sonegini duser", () => {
    expect(stripNumericSuffix("elma-2")).toBe("elma");
    expect(stripNumericSuffix("seftali-2")).toBe("seftali");
    expect(stripNumericSuffix("3208-haktan-komisyon-evi-2")).toBe("3208-haktan-komisyon-evi");
    expect(stripNumericSuffix("591-yesil-silvan-2")).toBe("591-yesil-silvan");
  });

  it("ikiden buyuk sonekleri de duser", () => {
    expect(stripNumericSuffix("elma-3")).toBe("elma");
    expect(stripNumericSuffix("elma-12")).toBe("elma");
  });

  it("sonek yoksa null", () => {
    expect(stripNumericSuffix("elma")).toBeNull();
    expect(stripNumericSuffix("domates-salcalik")).toBeNull();
    expect(stripNumericSuffix("biber-carliston")).toBeNull();
  });

  it("tamamen sayisal slug'i tanimlayici sayar, bolmez", () => {
    expect(stripNumericSuffix("2")).toBeNull();
    expect(stripNumericSuffix("3208-2")).toBeNull();
  });

  it("bosluk ve bos girdiye dayanir", () => {
    expect(stripNumericSuffix("")).toBeNull();
    expect(stripNumericSuffix("  elma-2  ")).toBe("elma");
    expect(stripNumericSuffix("-2")).toBeNull();
  });
});

describe("resolveCanonicalFallback", () => {
  const canli = new Set(["elma", "domates", "3208-haktan-komisyon-evi"]);
  const exists = (c: string) => canli.has(c);

  it("taban varsa kanonik slug doner", async () => {
    await expect(resolveCanonicalFallback("elma-2", exists)).resolves.toBe("elma");
    await expect(resolveCanonicalFallback("3208-haktan-komisyon-evi-2", exists))
      .resolves.toBe("3208-haktan-komisyon-evi");
  });

  it("taban yoksa null — 404 kalir", async () => {
    await expect(resolveCanonicalFallback("palaska-deniz-2", exists)).resolves.toBeNull();
  });

  it("sonegi olmayan slug icin hic denemez", async () => {
    await expect(resolveCanonicalFallback("elma", exists)).resolves.toBeNull();
  });

  it("async exists ile calisir", async () => {
    const asyncExists = async (c: string) => canli.has(c);
    await expect(resolveCanonicalFallback("domates-2", asyncExists)).resolves.toBe("domates");
  });
});
