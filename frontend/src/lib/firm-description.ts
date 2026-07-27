import type { Firm } from "@/lib/api";

const TYPE_PHRASE: Record<Firm["firmType"], string> = {
  komisyoncu: "bir hal komisyoncusudur",
  soguk_hava: "bir soğuk hava deposu işletmesidir",
  nakliye: "bir sebze-meyve nakliye firmasıdır",
  zirai_ilac: "bir zirai ilaç bayisidir",
};

function titleCase(value?: string | null): string {
  if (!value) return "";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

/**
 * Yapısal veriden benzersiz firma tanıtım paragrafı üretir. Amaç: her sayfaya
 * "{şehir} hal komisyoncusu" gibi sorguları hedefleyen özgün çerçeve metni koymak.
 * Asıl benzersiz içerik OCR komisyoncu dizini + yerel hal fiyatlarıdır; bu metin
 * onları çerçeveler. `firm.description` (sahiplenilmiş, elle yazılmış) varsa O kullanılır.
 */
export function buildFirmDescription(firm: Firm): string {
  const city = titleCase(firm.citySlug) || "Türkiye";
  const district = titleCase(firm.districtSlug);
  const place = district && district !== city ? `${city} ${district}` : city;
  const typePhrase = TYPE_PHRASE[firm.firmType] ?? "bir hal firmasıdır";
  const commissioners = (firm.ocrContacts ?? []).filter((c) => (c.phones ?? []).length > 0).length;

  const sentences: string[] = [
    `${firm.name}, ${place} bölgesinde faaliyet gösteren ${typePhrase}.`,
  ];

  if (commissioners >= 2) {
    sentences.push(
      `Firma bünyesindeki ${commissioners} komisyoncunun isim ve doğrudan iletişim numaraları bu sayfada listelenmiştir.`,
    );
  } else if (commissioners === 1) {
    sentences.push("Firmanın yetkili iletişim bilgileri bu sayfada yer almaktadır.");
  }

  if (firm.firmType === "komisyoncu") {
    sentences.push(
      `${city} Toptancı Hali'nin güncel toptan sebze ve meyve fiyatlarını inceleyebilir, ${firm.name} ile telefon veya WhatsApp üzerinden doğrudan iletişime geçebilirsiniz.`,
    );
  } else {
    sentences.push(
      `${city} hal ve pazar fiyatlarını takip edebilir, ${firm.name} ile telefon veya WhatsApp üzerinden iletişime geçebilirsiniz.`,
    );
  }

  return sentences.join(" ");
}
