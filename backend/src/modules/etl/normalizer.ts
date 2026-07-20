import { db } from "@/db/client";
import { hfProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

const PRODUCT_NAME_SPELLING_FIXES: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bavakado\b/giu, replacement: "Avokado" },
];

export function normalizeRawProductName(rawName: string): string {
  return PRODUCT_NAME_SPELLING_FIXES.reduce(
    (value, rule) => value.replace(rule.pattern, rule.replacement),
    rawName.replace(/\s+/g, " ").trim(),
  );
}

// Türkçe karakter normalizasyonu: Havuç → havuc, ÜZÜM → uzum, DİĞER → diger.
// toLocaleLowerCase('tr-TR') şart: default toLowerCase() "İ"yi combining dot
// ile "i̇" yaparak slug'ı "di-ger" gibi kırık çıkarır.
export function turkishToAscii(str: string): string {
  return str
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

// Birim sınıfı: farklı yazımları tek sınıfa indirger. Birim, ürün kimliğinin
// parçasıdır — kg ile adet aynı ürün sayılmaz (fiyatları karışmaz).
const UNIT_CLASS: ReadonlyArray<[RegExp, string]> = [
  [/^(kg|kilo|kilogram)\b/i, "kg"],
  [/^(adet|tane|ad)\b/i, "adet"],
  [/^(demet)\b/i, "demet"],
  [/^(kasa)\b/i, "kasa"],
  // koli SART: fiyat gecmisinde fiilen kullanilan iki birimden biri (digeri kg).
  // Listede olmasaydi asagidaki "kg" varsayimina duser ve koli fiyatlari kg
  // fiyatlariyla ayni urune karisirdi — Yalova ithal muzu 2400 TL/koli.
  [/^(koli|kutu)\b/i, "koli"],
  [/^(paket|pk)\b/i, "paket"],
  [/^(bag|bag)\b/i, "bag"],
  [/^(litre|lt|l)\b/i, "litre"],
];

/**
 * Birimi sinifina indirger.
 *
 * Iki savunma katmani var, cunku kaynak tablolardan birim sutunu yerine BASLIK
 * metni sizabiliyor. `hf_products.unit` alaninda bulunan gercek ornekler:
 *
 *   "kasa (10 kg)p ks.-s kut."   <- Ankara/Bursa balik tablosu sutun basligi
 *   "kilo (1 kg)p ks- s kut"
 *   "sardalya", "napolyon", "asili"  <- urun adi parcasi, birim degil
 *   "(adet)", "18 kg", "taze kg", "kg."
 *
 * 1. Bastaki parantez/sayi/sifat temizlenir, sonra sinif tablosu uygulanir —
 *    "(adet)" -> adet, "18 kg" / "taze kg" -> kg.
 * 2. Hicbir sinifa girmeyen deger BIRIM DEGILDIR; "kg" varsayilir. Onceden ham
 *    dize geri donuyordu ve `productMatchKey`'in parcasi oldugu icin
 *    "sardalya" birimli bir urun, ayni urunun kg'lik kaydiyla eslesmiyordu.
 */
export function unitClass(unit: string | null | undefined): string {
  const raw = turkishToAscii(unit ?? "").trim();
  if (!raw) return "kg";

  const candidates = [
    raw,
    raw.replace(/^[^a-z]+/i, ""),          // "18 kg" -> "kg", "(adet)" -> "adet)"
    raw.replace(/[()]/g, " ").trim(),      // "(adet)" -> "adet"
    raw.split(/\s+/).slice(-1)[0] ?? "",   // "taze kg" -> "kg"
  ];

  for (const candidate of candidates) {
    for (const [re, cls] of UNIT_CLASS) if (re.test(candidate)) return cls;
  }

  // Sessizce yutma: gercekten YENI bir birim (ornegin yeni bir kaynak "ton"
  // bildirmeye baslarsa) burada goze carpsin ki UNIT_CLASS'a eklensin. Aksi
  // halde ton fiyatlari kg diye kaydedilir — TOBB'da bir kez yasandi.
  if (!_warnedUnits.has(raw)) {
    _warnedUnits.add(raw);
    console.warn(`[normalizer] taninmayan birim "${raw}" — kg varsayildi. Gercek birimse UNIT_CLASS'a ekle.`);
  }
  return "kg";
}

/** Ayni bilinmeyen birim icin log bir kez basilir; ETL dongusu gurultu yapmasin. */
const _warnedUnits = new Set<string>();

// Kanonik eşleştirme anahtarı: tr-ascii + noktalama sil + kelimeleri SIRALA + birim sınıfı.
// "Aysberg Marul", "Marul Aysberg", "Marul, Aysberg" (aynı birim) → AYNI anahtar.
// (Eşanlamlı aysberg/iceberg gibi farklar için ürünün alias'ları yeterlidir.)
export function productMatchKey(rawName: string, unit?: string | null): string {
  const base = turkishToAscii(normalizeRawProductName(rawName))
    .replace(/[.,()/\\_'"’-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = base.split(" ").filter(Boolean).sort();
  return `${tokens.join(" ")}|${unitClass(unit)}`;
}

// İki harita: exact (birebir isim, legacy) + byKey (birim-kapsamlı eşleştirme anahtarı).
let _exactMap: Map<string, string> | null = null;
let _keyMap: Map<string, string> | null = null;
let _mapsAt = 0;
const ALIAS_TTL_MS = 5 * 60 * 1000; // 5 dakika cache

async function getMaps(): Promise<{ exact: Map<string, string>; byKey: Map<string, string> }> {
  const now = Date.now();
  if (_exactMap && _keyMap && now - _mapsAt < ALIAS_TTL_MS) return { exact: _exactMap, byKey: _keyMap };

  const products = await db
    .select({ slug: hfProducts.slug, nameTr: hfProducts.nameTr, aliases: hfProducts.aliases, unit: hfProducts.unit })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1));

  const exact = new Map<string, string>();
  const byKey = new Map<string, string>();

  // İKİ GEÇİŞ — ürünün KENDİ adı, başka bir ürünün alias'ını yener.
  //
  // Neden: merge sırasında varyantın adı master'ın alias listesine ekleniyor ama varyant
  // ürünü aktif kalıyor (canonical_slug ile master'a bağlı). Böylece iki ürün aynı
  // eşleştirme anahtarını talep ediyor. Eski davranış "ilk gelen kazanır"dı ve kazananı
  // DB satır sırası belirliyordu — belirlenimsiz.
  //
  // Somut sonuç (2026-07-20, Kumluca): kaynak sayfada "Domates 25₺", "Yuvarlak Domates 30₺",
  // "Oval Domates 35₺" olmasına rağmen üçü de `domates` ürününe düşüyordu; (ürün, hal, tarih)
  // unique key yüzünden son satır diğerlerini eziyor ve halin domates fiyatı her gün 35₺
  // (oval fiyatı) olarak kaydediliyordu. 25₺ ve 30₺ sessizce kayboluyordu.
  //
  // Katalog genelinde 1.525 anahtarın 513'ü (=%34) çakışıyordu; 653 ürün etkileniyordu.
  //
  // Varyantın kendi kaydını tutması doğru davranış: aile toplaması zaten canonical_slug
  // üzerinden yapılıyor, granülarite kaybedilmemeli.
  // Slug'a göre sıralı gezinme: iki ürün aynı anahtarı aynı öncelikte talep ederse
  // kazananı DB satır sırası değil, sabit bir kural belirlesin (tekrarlanabilirlik).
  const ordered = [...products].sort((a, b) => a.slug.localeCompare(b.slug));

  const claim = (name: string, slug: string, unit: string | null) => {
    const e = turkishToAscii(name);
    if (!exact.has(e)) exact.set(e, slug);
    const k = productMatchKey(name, unit);
    if (!byKey.has(k)) byKey.set(k, slug);
  };

  for (const p of ordered) {
    if (p.nameTr) claim(p.nameTr, p.slug, p.unit);
  }
  for (const p of ordered) {
    for (const alias of ((p.aliases as string[] | null) ?? [])) {
      if (alias) claim(alias, p.slug, p.unit);
    }
  }

  _exactMap = exact;
  _keyMap = byKey;
  _mapsAt = now;
  return { exact, byKey };
}

export async function getAliasMap(): Promise<Map<string, string>> {
  return (await getMaps()).exact;
}

// Ham API ürün adı (+birim) → slug. Önce birim-kapsamlı anahtar (varyantları toplar),
// sonra legacy birebir isim (emniyet ağı). Bulunamazsa null.
export async function resolveProductSlug(rawName: string, unit?: string | null): Promise<string | null> {
  const { exact, byKey } = await getMaps();
  if (unit != null) {
    const hit = byKey.get(productMatchKey(rawName, unit));
    if (hit) return hit;
  }
  return exact.get(turkishToAscii(normalizeRawProductName(rawName))) ?? null;
}

// Cache'i geçersiz kıl (yeni ürün eklendikten / merge sonrası çağrılır)
export function invalidateAliasCache(): void {
  _exactMap = null;
  _keyMap = null;
  _mapsAt = 0;
}
