import { describe, expect, test } from "bun:test";
import { decideEtlCatchup, minutesOfDayInZone, parseDailyCronTime } from "./catchup";

const base = { graceMinutes: 45, deadlineMinutes: 18 * 60, activeSourceCount: 50 };

describe("ETL telafi karari", () => {
  test("gunluk cron ifadesinden saati okur", () => {
    expect(parseDailyCronTime("30 7 * * *")).toEqual({ hour: 7, minute: 30 });
    expect(parseDailyCronTime("0 14 * * *")).toEqual({ hour: 14, minute: 0 });
    // Sabit gunluk saat olmayan ifadeler telafi edilemez; tahmin uretilmez.
    expect(parseDailyCronTime("*/30 * * * *")).toBeNull();
    expect(parseDailyCronTime("30 6,8,10 * * *")).toBeNull();
    expect(parseDailyCronTime("99 7 * * *")).toBeNull();
  });

  test("zaman dilimine gore gun icindeki dakikayi verir", () => {
    expect(minutesOfDayInZone(new Date("2026-09-22T07:30:00Z"), "UTC")).toBe(7 * 60 + 30);
    expect(minutesOfDayInZone(new Date("2026-09-22T07:30:00Z"), "Europe/Istanbul")).toBe(10 * 60 + 30);
  });

  test("2026-09-22 vakasi: kosu dusmus, telafi calisir", () => {
    // Gercek olay: 07:30 tetiklemesi kayboldu, gun icinde yalniz iki ek kaynak
    // (Antalya 10:30) yazdi. Bu durum telafi edilmeliydi.
    const decision = decideEtlCatchup({ ...base, nowMinutes: 11 * 60 + 20, scheduledMinutes: 7 * 60 + 30, ranSourceCount: 2 });
    expect(decision.run).toBe(true);
    expect(decision.reason).toContain("2/50");
  });

  test("normal gunde telafi calismaz", () => {
    const decision = decideEtlCatchup({ ...base, nowMinutes: 11 * 60, scheduledMinutes: 7 * 60 + 30, ranSourceCount: 50 });
    expect(decision.run).toBe(false);
    expect(decision.reason).toContain("yapilmis");
  });

  test("planlanan saatin hemen ardinda beklenir — kosu surerken telafi tetiklemez", () => {
    // 07:45'te ETL daha yeni basladi; pay dolmadan "eksik" denmez.
    expect(decideEtlCatchup({ ...base, nowMinutes: 7 * 60 + 45, scheduledMinutes: 7 * 60 + 30, ranSourceCount: 3 }).run).toBe(false);
    // Pay dolunca eksiklik gercek sayilir.
    expect(decideEtlCatchup({ ...base, nowMinutes: 8 * 60 + 20, scheduledMinutes: 7 * 60 + 30, ranSourceCount: 3 }).run).toBe(true);
  });

  test("aksam penceresi kapanir", () => {
    expect(decideEtlCatchup({ ...base, nowMinutes: 19 * 60, scheduledMinutes: 7 * 60 + 30, ranSourceCount: 0 }).run).toBe(false);
  });

  test("kismi kosu yeterli sayilir, tekrar cekilmez", () => {
    // Kaynaklarin yarisi yazdiysa ana kosu gerceklesmis demektir; kalan
    // eksikler saglik kontrolunun isi, telafinin degil.
    expect(decideEtlCatchup({ ...base, nowMinutes: 12 * 60, scheduledMinutes: 7 * 60 + 30, ranSourceCount: 25 }).run).toBe(false);
    expect(decideEtlCatchup({ ...base, nowMinutes: 12 * 60, scheduledMinutes: 7 * 60 + 30, ranSourceCount: 24 }).run).toBe(true);
  });
});
