// sendOpsAlert'in mesaj bolme davranisi. Test burada cunku packages/ reposunda kosan
// bir suite yok; hal-fiyatlari ETL saglik uyarisinin en buyuk uretecisi olan proje.
//
// Regresyon: 2026-08-31'de ETL saglik uyarisi iki kez HTTP 400 "message is too long"
// alip TUMDEN dustu. Uyari her sorunlu kaynak icin satir yaziyor, yani sorun sayisi
// arttikca mesaj uzuyor — uyarinin en kritik oldugu anda kesin olarak kayboluyordu.
import { describe, expect, it } from "vitest";
import { splitForTelegram } from "@agro/shared-backend/modules/telegram";

const LIMIT = 4096;

describe("splitForTelegram", () => {
  it("limit altindaki metni bolmez", () => {
    expect(splitForTelegram("kisa uyari")).toEqual(["kisa uyari"]);
  });

  it("uzun uyariyi limite sigan parcalara boler", () => {
    const text = Array.from({ length: 400 }, (_, i) => `kaynak-${i}: veri donmus, 30 gundur ayni parmak izi`).join("\n");
    const parts = splitForTelegram(text);
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(LIMIT);
  });

  it("bolme kayipsizdir — hicbir satir dusmez", () => {
    const text = Array.from({ length: 400 }, (_, i) => `kaynak-${i}: veri donmus`).join("\n");
    expect(splitForTelegram(text).join("\n")).toBe(text);
  });

  it("satir sinirini korur, tabloyu ortadan kesmez", () => {
    const text = Array.from({ length: 300 }, (_, i) => `| kaynak-${i} | 0 satir | kritik |`).join("\n");
    for (const part of splitForTelegram(text)) {
      for (const line of part.split("\n")) {
        expect(line === "" || line.startsWith("| kaynak-")).toBe(true);
      }
    }
  });

  it("tek satir limiti asiyorsa sert boler ama kaybetmez", () => {
    const line = "x".repeat(9000);
    const parts = splitForTelegram(line);
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(LIMIT);
    expect(parts.join("")).toBe(line);
  });

  it("yarim HTML varligi birakmaz — parse_mode=HTML mesajin tamamini reddeder", () => {
    const text = "a".repeat(LIMIT - 6) + "&amp;" + "b".repeat(200);
    const parts = splitForTelegram(text);
    expect(parts[0]).not.toMatch(/&[a-z]*$/);
    expect(parts.join("")).toBe(text);
  });
});
