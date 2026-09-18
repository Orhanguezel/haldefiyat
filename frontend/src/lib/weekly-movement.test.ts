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

// 18 Eyl 2026: urun sayfasi 30 gunluk rakami eslesmemis calculateWindowTrend'den
// aliyordu ve ayni sayfada iki celisen 7 gunluk sayi yayimlaniyordu (limon
// %2,5 gerileme ve %7,4 dusus). Tek yontem kaldi; pencere artik parametre.
describe("pencere uzunlugu parametresi", () => {
  const gun = (marketSlug: string, productSlug: string, gunOnce: number, fiyat: number): MovementRow => ({
    recordedDate: new Date(NOW.getTime() - gunOnce * 86400000).toISOString().slice(0, 10),
    avgPrice: fiyat,
    marketSlug,
    productSlug,
    cityName: marketSlug,
    unit: "kg",
  });

  it("30 gunluk pencere son 30 gunu onceki 30 gunle kiyaslar", () => {
    const rows = [
      ...[1, 10, 20, 29].map((d) => gun("konya", "limon", d, 50)),
      ...[31, 40, 50, 59].map((d) => gun("konya", "limon", d, 100)),
      ...[2, 11, 21, 28].map((d) => gun("izmir", "limon", d, 50)),
      ...[32, 41, 51, 58].map((d) => gun("izmir", "limon", d, 100)),
    ];
    const m = computeWeeklyMovement(rows, NOW, 30)!;
    expect(m.windowDays).toBe(30);
    expect(Math.round(m.changePct)).toBe(-50);
    expect(m.marketCount).toBe(2);
  });

  it("7 ve 30 gunluk pencereler ayni diziden ayri sonuc verir", () => {
    const rows = [
      // Son hafta 90, onceki hafta 100 → 7 gunde %-10.
      ...[0, 3, 6].map((d) => gun("konya", "limon", d, 90)),
      ...[8, 11, 13].map((d) => gun("konya", "limon", d, 100)),
      // 30-60 gun arasi 180 → 30 gunde belirgin dusus.
      ...[20, 25, 29].map((d) => gun("konya", "limon", d, 95)),
      ...[35, 45, 55].map((d) => gun("konya", "limon", d, 180)),
    ];
    const kisa = computeWeeklyMovement(rows, NOW, 7)!;
    const uzun = computeWeeklyMovement(rows, NOW, 30)!;
    expect(Math.round(kisa.changePct)).toBe(-10);
    expect(uzun.changePct).toBeLessThan(-30);
  });

  it("bayatlik esigi pencereyle olceklenir — 7 gunluk davranis degismedi", () => {
    // Son kayit 20 gun once: 7 gunluk kiyas icin bayat (esik 14), 30 icin degil (esik 60).
    const rows = [
      ...[20, 22, 24].map((d) => gun("konya", "limon", d, 90)),
      ...[28, 30, 32].map((d) => gun("konya", "limon", d, 100)),
      ...[40, 50].map((d) => gun("konya", "limon", d, 100)),
    ];
    expect(computeWeeklyMovement(rows, NOW, 7)).toBeNull();
    expect(computeWeeklyMovement(rows, NOW, 30)).not.toBeNull();
  });

  it("cumle pencereye gore yazilir", () => {
    const rows = [
      ...[1, 10, 25].map((d) => gun("konya", "limon", d, 50)),
      ...[35, 45, 55].map((d) => gun("konya", "limon", d, 100)),
    ];
    const m = computeWeeklyMovement(rows, NOW, 30)!;
    const cumle = describeWeeklyMovement("Limon", m);
    expect(cumle).toContain("son 30 günde");
    expect(cumle).toContain("her iki 30 günlük dönemde de");
    expect(cumle).not.toContain("son haftada");
  });
});

// 18 Eyl 2026 olcumu: oran esigi tek basina 30 gunluk pencerede mevsimsel
// gercek hareketi eliyordu (nar manseti -%32,9 yerine -%21,3). Ayrim artik
// buyuklukte degil yonde.
describe("kararlilik: buyukluk degil yon", () => {
  const seri = (marketSlug: string, gunler: Array<[number, number]>): MovementRow[] =>
    gunler.map(([gunOnce, fiyat]) => ({
      recordedDate: new Date(NOW.getTime() - gunOnce * 86400000).toISOString().slice(0, 10),
      avgPrice: fiyat,
      marketSlug,
      productSlug: "nar",
      cityName: marketSlug,
      unit: "kg",
    }));

  /** 30 gunde tek yonlu 3 kat dusus: sezon acilisi, gurultu degil. */
  const mevsimsel = (marketSlug: string, bas: number, adim: number) =>
    seri(marketSlug, Array.from({ length: 24 }, (_, i) => [i + 1, bas - i * adim] as [number, number])
      .concat(Array.from({ length: 24 }, (_, i) => [i + 32, bas + 40 - i * adim] as [number, number])));

  it("tek yonlu mevsimsel seri 2 kati assa da kiyasa girer", () => {
    const rows = mevsimsel("mersin", 120, 3);
    const m = computeWeeklyMovement(rows, NOW, 30);
    expect(m).not.toBeNull();
    expect(m!.marketCount).toBe(1);
  });

  it("ayni genlikte ama salinan seri hala elenir", () => {
    // Bilinen bozuk kaynak imzasi: 10 ile 100 arasi gidip gelen ulusal kayit.
    const salinan = seri("ulusal", Array.from({ length: 48 }, (_, i) =>
      [i + 1, i % 2 === 0 ? 10 : 100] as [number, number]));
    expect(computeWeeklyMovement(salinan, NOW, 30)).toBeNull();
  });

  it("tek yonlu ama az noktali seri kurtarilmaz", () => {
    // 4 nokta sansa tam tutarli cikabilir; esik 10 nokta.
    const az = seri("bolu", [[1, 30], [5, 60], [10, 90], [14, 120], [33, 30], [38, 60], [43, 90], [48, 120]]);
    expect(computeWeeklyMovement(az, NOW, 30)).toBeNull();
  });

  it("oran esigi altindaki normal seri eskisi gibi gecer", () => {
    const normal = seri("konya", [[1, 50], [4, 52], [8, 48], [12, 51], [32, 60], [36, 58], [40, 62], [44, 59]]);
    const m = computeWeeklyMovement(normal, NOW, 30)!;
    expect(m.marketCount).toBe(1);
    expect(m.changePct).toBeLessThan(0);
  });
});
