// Ürün "kök isim" (family) tespiti — deterministik, hard-code YOK.
// Kök = ürün adı token'ları içinden global frekansı en yüksek olan (niteleyiciler hariç).
// "Domates", "Domates Beef", "Domates Salkım" → hepsi kök "domates" → aynı family_slug.
// canonical=aynı şeyin farklı yazımı (varyant); family=farklı çeşit (ayrı sayfa, seçiciyle bağlı).

// Kök adayı OLAMAYACAK niteleyiciler (renk/tazelik/menşe/boy/birim/jenerik/ek).
const QUALIFIER = new Set([
  "yerli", "sera", "ithal", "adet", "paket", "tane", "kg", "kilogram", "kasa", "gr", "kilo", "koli", "demet", "bas",
  "normal", "muhtelif", "ikinci", "birinci", "iyi", "tarim", "kucukboy", "buyukboy", "kucuk", "buyuk", "orta", "iri",
  "taze", "kuru", "donuk", "dondurulmus", "kirmizi", "yesil", "sari", "beyaz", "mor", "siyah", "pembe", "turuncu",
  "deniz", "kultur", "koy", "karadeniz", "marmara", "ege", "akdeniz", "kalite", "ekstra", "diger", "cesit", "karisik",
  "organik", "salata", "salat", "yagli", "kop", "ince", "kalin",
  "otu", "ot", "yaprak", "yapragi", "cicek", "cicegi", "tatli", "aci", "eksi", "sap", "filiz", "tohum",
  "yas", "grass", "dilimlenmis", "kavrulmus", "haslanmis", "yeni",
]);

export function tokenizeName(name: string): string[] {
  return name
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/(lik|luk)$/, ""))
    .filter((t) => t.length >= 3 && !QUALIFIER.has(t));
}

export interface FamilyInput {
  id: number;
  name: string;
}

// Her ürün için kök token döner (id → base). Boş string = köksüz.
// Türkçe iyelik/çoğul eki toleransı: "biberi"→"biber" (sonuç zaten bir kök ise);
// "biberiye" ('e' ile biter) etkilenmez → yanlış eşleşme olmaz.
export function computeBaseMap(products: FamilyInput[]): Map<number, string> {
  const freq = new Map<string, number>();
  const toks = new Map<number, string[]>();
  for (const p of products) {
    const t = tokenizeName(p.name);
    toks.set(p.id, t);
    for (const x of new Set(t)) freq.set(x, (freq.get(x) ?? 0) + 1);
  }

  const baseOf = (id: number): string => {
    const t = toks.get(id) ?? [];
    if (!t.length) return "";
    return t.reduce((best, x) => {
      const fb = freq.get(best) ?? 0;
      const fx = freq.get(x) ?? 0;
      if (fx > fb) return x;
      if (fx === fb && x.length < best.length) return x;
      return best;
    });
  };

  const raw = new Map<number, string>();
  for (const p of products) raw.set(p.id, baseOf(p.id));

  const bases = new Set([...raw.values()].filter(Boolean));
  const stem = (b: string): string => {
    for (const suf of ["leri", "lari", "si", "i"]) {
      if (b.length - suf.length >= 4 && b.endsWith(suf)) {
        const s = b.slice(0, b.length - suf.length);
        if (bases.has(s)) return s;
      }
    }
    return b;
  };

  const out = new Map<number, string>();
  for (const [id, b] of raw) out.set(id, b ? stem(b) : "");
  return out;
}
