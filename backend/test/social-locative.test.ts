import { describe, expect, it } from "bun:test";
import { locative } from "@/modules/social/cards";

describe("sehir adina bulunma eki", () => {
  it("kalin ve ince sesli uyumu", () => {
    expect(locative("Konya")).toBe("Konya'da");
    expect(locative("Yalova")).toBe("Yalova'da");
    expect(locative("Denizli")).toBe("Denizli'de");
    expect(locative("Eskişehir")).toBe("Eskişehir'de");
  });

  it("sert unsuzde -ta/-te", () => {
    expect(locative("Tokat")).toBe("Tokat'ta");
    expect(locative("Sinop")).toBe("Sinop'ta");
    expect(locative("Uşak")).toBe("Uşak'ta");
    expect(locative("Gaziantep")).toBe("Gaziantep'te");
  });

  it("buyuk I ve son sesli harfler", () => {
    expect(locative("Isparta")).toBe("Isparta'da");
    expect(locative("İstanbul")).toBe("İstanbul'da");
    expect(locative("Bursa")).toBe("Bursa'da");
    expect(locative("Kütahya")).toBe("Kütahya'da");
  });
});
