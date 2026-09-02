import type { BorsaPriceRow } from "./types";

/**
 * TMO alim fiyatlari SCRAPE EDILMEZ — Toprak Mahsulleri Ofisi her hasat sezonu
 * icin tek bir alim fiyati ILAN eder ve o deger sezon boyunca degismez. Deger
 * burada elle tutulur.
 *
 * Bu yuzden asil risk "kaynak durdu" degil, DEGERIN SESSIZCE ESKIMESIDIR: yeni
 * sezon ilani geldiginde bu dosya guncellenmezse gecen yilin fiyati bugunun
 * tarihiyle yayinlanmaya devam eder ve hicbir alarm calmaz. Gecerlilik tarihi
 * bunu gurultulu hale getirir: tarih gecince kaynak veri uretmez, ETL saglik
 * raporunda "veri yok" olarak gorunur ve guncellenmesi gerektigi anlasilir.
 *
 * GUNCELLERKEN: fiyatlari ve GECERLILIK_SONU'nu birlikte degistir.
 * Kaynak: https://www.tmo.gov.tr — "Hububat Alim Fiyatlari" duyurusu.
 */
const GECERLILIK_SONU = "2027-05-31";

const TMO_ALIM: Array<{ name: string; category: string; ton: number }> = [
  { name: "Buğday", category: "hububat", ton: 16_500 },
  { name: "Arpa", category: "hububat", ton: 12_750 },
];

export function parseTmoAlimResmi(): BorsaPriceRow[] {
  const recordedDate = new Date().toISOString().slice(0, 10);
  if (recordedDate > GECERLILIK_SONU) return [];

  return TMO_ALIM.map((row) => ({
    name: row.name,
    category: row.category,
    unit: "kg",
    avg: row.ton / 1000,
    min: row.ton / 1000,
    max: row.ton / 1000,
    recordedDate,
  }));
}
