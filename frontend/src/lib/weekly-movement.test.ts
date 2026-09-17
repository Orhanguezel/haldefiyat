import { describe, expect, it } from "vitest";
import { computeWeeklyMovement, describeWeeklyMovement, type MovementRow } from "./weekly-movement";

const NOW = new Date("2026-09-17T10:00:00Z");
const day = (offset: number) => new Date(Date.parse("2026-09-16T00:00:00Z") - offset * 86400000).toISOString();

const row = (
  marketSlug: string,
  cityName: string,
  offset: number,
  avgPrice: number,
  productSlug = "urun",
): MovementRow => ({ recordedDate: day(offset), avgPrice, cityName, marketSlug, productSlug, unit: "kg" });

describe("computeWeeklyMovement", () => {
  it("iki pencerede de kaydi olan halleri esler ve degisimi hesaplar", () => {
    const rows = [
      row("konya", "Konya", 1, 22), row("konya", "Konya", 9, 20),
      row("bursa", "Bursa", 2, 33), row("bursa", "Bursa", 10, 30),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.marketCount).toBe(2);
    expect(m.previous).toBe(25);
    expect(m.current).toBeCloseTo(27.5, 5);
    expect(m.changePct).toBeCloseTo(10, 5);
  });

  it("YALNIZ bir pencerede yayin yapan hali kiyasa KATMAZ", () => {
    // Pahali hal sadece bu hafta yayin yapti; ortalamaya girerse sahte artis uretir.
    const rows = [
      row("konya", "Konya", 1, 22), row("konya", "Konya", 9, 20),
      row("pahali", "Pahalı", 1, 200),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.marketCount).toBe(1);
    expect(m.current).toBe(22);
    expect(m.changePct).toBeCloseTo(10, 5);
  });

  it("hareketin yayginligini hal sayisiyla verir", () => {
    const rows = [
      row("konya", "Konya", 1, 30), row("konya", "Konya", 9, 20),
      row("bursa", "Bursa", 1, 18), row("bursa", "Bursa", 9, 20),
      row("izmir", "İzmir", 1, 19), row("izmir", "İzmir", 9, 20),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.risingMarkets).toBe(1);
    expect(m.fallingMarkets).toBe(2);
    expect(describeWeeklyMovement("Patates", m)).toContain("2 halde geriledi, 1 halde yükseldi");
  });

  // Uc-deger secimi (en cok artan sehir) UC AYRI artefakt uretip kaldirildi;
  // sayim tek bir bozuk seriye 18'de bir agirlik verir, basligi ele gecirmez.
  it("tek bir uc seri cumleyi ele gecirmez", () => {
    const rows = [
      // Artik kategori tipi torba kayit: iki hafta arasi ikiye katlaniyor.
      row("eskisehir", "Eskişehir", 1, 42), row("eskisehir", "Eskişehir", 9, 17.5),
      ...["konya", "bursa", "izmir", "adana"].flatMap((k) => [row(k, k, 1, 20), row(k, k, 9, 20.4)]),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;
    const cumle = describeWeeklyMovement("Elma", m);

    expect(m.risingMarkets).toBe(1);
    expect(m.fallingMarkets).toBe(4);
    expect(cumle).not.toContain("Eskişehir");
    expect(cumle).toContain("4 halde geriledi");
  });

  it("kucuk oynamayi hareket saymaz", () => {
    const rows = [row("konya", "Konya", 1, 20.05), row("konya", "Konya", 9, 20)];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.risingMarkets).toBe(0);
    expect(m.fallingMarkets).toBe(0);
    expect(describeWeeklyMovement("Patates", m)).toContain("yatay");
  });

  it("veri bayatsa hic cumle uretmez", () => {
    const eski = [{ recordedDate: "2026-08-01T00:00:00.000Z", avgPrice: 20, marketSlug: "konya", cityName: "Konya" }];
    expect(computeWeeklyMovement(eski, NOW)).toBeNull();
  });

  it("onceki hafta kaydi yoksa null — tek pencereyle degisim uydurulmaz", () => {
    expect(computeWeeklyMovement([row("konya", "Konya", 1, 22)], NOW)).toBeNull();
  });
});

describe("describeWeeklyMovement", () => {
  it("cumle olculen sayilardan turer ve dayanagini soyler", () => {
    const m = computeWeeklyMovement([
      row("konya", "Konya", 1, 22), row("konya", "Konya", 9, 20),
      row("bursa", "Bursa", 1, 28), row("bursa", "Bursa", 9, 30),
    ], NOW)!;
    const s = describeWeeklyMovement("Patates", m);
    expect(s).toContain("Patates son haftada");
    expect(s).toContain("2 halin her iki haftada da yayımladığı");
    expect(s).toContain("halde");
  });
});

describe("kararsiz seri suzgeci", () => {
  // Eskisehir patates, 17 Eyl 2026 canli verisi. Ayni hal ayni urun icin bir
  // hafta icinde 7,00 / 29,50 / 11,26 / 36,00 TL/kg yaziyordu. Ortalamada 18
  // halin arasinda eriyordu ama "en cok artan sehir" en UC hali sectigi icin
  // tam da bu bozuk kaynagi %41,2 ile one cikariyordu.
  const eskisehirGercek: MovementRow[] = [
    ...[7.0, 29.5, 11.26, 36.0, 12.24, 28.51].map((p, i) => row("eskisehir-hal", "Eskişehir", i + 1, p)),
    ...[29.0, 21.06, 15.47, 15.47].map((p, i) => row("eskisehir-hal", "Eskişehir", i + 9, p)),
  ];
  const tokatGercek: MovementRow[] = [
    ...[23.75, 25.0, 19.5, 19.5, 19.5].map((p, i) => row("tokat-hal", "Tokat", i + 1, p)),
    ...[27.0, 27.0, 27.0, 27.5].map((p, i) => row("tokat-hal", "Tokat", i + 9, p)),
  ];

  it("kendi icinde 5 kat oynayan hali sehir kiyasindan da ortalamadan da CIKARIR", () => {
    const m = computeWeeklyMovement([...eskisehirGercek, ...tokatGercek], NOW)!;

    expect(m.marketCount).toBe(1);
    expect(m.fallingMarkets).toBe(1);
  });

  it("kararli hal kalmazsa blok hic basilmaz — gurultuden cumle uretilmez", () => {
    expect(computeWeeklyMovement(eskisehirGercek, NOW)).toBeNull();
  });

  it("tek gunluk sicrama haftalik seviyeyi belirlemez (ortanca)", () => {
    const rows = [
      // Son hafta: dort gun 20 civari, bir gun 31 (esik icinde ama uc deger).
      ...[20, 20.5, 19.8, 31].map((p, i) => row("konya", "Konya", i + 1, p)),
      ...[20, 20, 20, 20].map((p, i) => row("konya", "Konya", i + 9, p)),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;

    // Ortalama olsaydi 22,83 → %14 artis. Ortanca 20,25 → %1,3.
    expect(m.current).toBeCloseTo(20.25, 5);
    expect(Math.abs(m.changePct)).toBeLessThan(2);
  });
});


describe("cesit degisimi suzgeci", () => {
  // Kahramanmaras domates, 17 Eyl 2026 canli verisi. Hal haftada bir yayin
  // yapiyor ve iki pencerede FARKLI cesit yazmis: 7 Eyl `domates-bursa` 13,00 —
  // 14 Eyl `domates` 25,00. Urun sayfasi aile satirlarini birlestirdigi icin
  // hal esleser ama urun eslesmezdi ve blok "%92,3 artis" yaziyordu.
  it("ayni hal iki haftada farkli cesit yayinladiysa o hali kiyasa KATMAZ", () => {
    const rows = [
      row("kahramanmaras-hal", "Kahramanmaraş", 2, 25.0, "domates"),
      row("kahramanmaras-hal", "Kahramanmaraş", 9, 13.0, "domates-bursa"),
      row("konya-hal", "Konya", 2, 30.0, "domates"),
      row("konya-hal", "Konya", 9, 29.0, "domates"),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;

    expect(m.marketCount).toBe(1);
  });

  it("ayni hal ayni cesitte devam ediyorsa normal kiyaslanir", () => {
    const rows = [
      row("kahramanmaras-hal", "Kahramanmaraş", 2, 25.0, "domates"),
      row("kahramanmaras-hal", "Kahramanmaraş", 9, 20.0, "domates"),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;

    expect(m.marketCount).toBe(1);
    expect(m.changePct).toBeCloseTo(25, 5);
  });

  it("bir hal iki cesidi de yayinliyorsa hal bir kez sayilir", () => {
    const rows = [
      row("izmir-hal", "İzmir", 2, 30.0, "domates"),
      row("izmir-hal", "İzmir", 9, 28.0, "domates"),
      row("izmir-hal", "İzmir", 2, 40.0, "domates-salkim"),
      row("izmir-hal", "İzmir", 9, 38.0, "domates-salkim"),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;

    expect(m.marketCount).toBe(1);
  });
});
