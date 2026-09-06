import { describe, expect, it } from "bun:test";
import { normalizeRawProductName } from "@/modules/etl/normalizer";

describe("tekrar eden urun adi", () => {
  it("kaynak adi iki kez basmissa tek hale getirir", () => {
    expect(normalizeRawProductName("YENİ DÜNYA(MALTA ERİĞİ) YENİ DÜNYA (MALTA ERİĞİ)")).toBe("YENİ DÜNYA(MALTA ERİĞİ)");
    expect(normalizeRawProductName("SALATALIK TURŞULUK SALATALIK TURŞULUK")).toBe("SALATALIK TURŞULUK");
    expect(normalizeRawProductName("LİMON OTU (LİMON GRASS) LİMON OTU(LİMON GRASS)")).toBe("LİMON OTU (LİMON GRASS)");
  });

  it("gercek tekrarli adlari bozmaz", () => {
    expect(normalizeRawProductName("Domates Domates Salkım")).toBe("Domates Domates Salkım");
    expect(normalizeRawProductName("Biber Sivri")).toBe("Biber Sivri");
    expect(normalizeRawProductName("Elma")).toBe("Elma");
  });

  it("yazim duzeltmeleri calismaya devam eder", () => {
    expect(normalizeRawProductName("AVAKADO")).toBe("Avokado");
    expect(normalizeRawProductName("maydonoz")).toBe("Maydanoz");
  });
});
