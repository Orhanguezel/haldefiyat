function turkishToAscii(value: string): string {
  return value.toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").trim();
}

const CATEGORY_ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/^(balik|deniz urun|su urun)/, "balik"],
  [/^(et|karkas|sakatat)/, "et"],
  [/^(canli hayvan|buyukbas|kucukbas)/, "canli-hayvan"],
  [/^(sebze ve meyve|sebze meyve|meyve sebze)/, "sebze-meyve"],
  [/^sebze/, "sebze"],
  [/^meyve/, "meyve"],
  [/^(hububat|tahil)/, "hububat"],
  [/^(bakliyat|kuru bakliyat)/, "bakliyat-kuru"],
];

const FISH_NAMES = /\b(hamsi|istavrit|palamut|levrek|cipura|sardalya|uskumru|mezgit|barbun|kalkan|somon|alabalik|karides|kalamar|ahtapot|midye|istakoz)\b/;
const MEAT_NAMES = /\b(karkas|dana eti|kuzu eti|koyun eti|keci eti|bonfile|antrikot|pirzola)\b/;
const LIVE_ANIMAL_NAMES = /\b(canli dana|canli kuzu|canli koyun|canli keci|tosun|duve)\b/;

function slugifyCategory(raw: string): string {
  return turkishToAscii(raw)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Kaynak kategori adlarını tek sözlüğe indirger; açık ürün sinyali yanlış geniş kategoriyi ezer. */
export function canonicalProductCategory(input: {
  rawCategory?: string | null;
  rawName?: string | null;
  fallback?: string | null;
}): string {
  const name = turkishToAscii(input.rawName ?? "").replace(/[^a-z0-9]+/g, " ");
  if (FISH_NAMES.test(name)) return "balik";
  if (MEAT_NAMES.test(name)) return "et";
  if (LIVE_ANIMAL_NAMES.test(name)) return "canli-hayvan";

  const raw = turkishToAscii(input.rawCategory ?? "").replace(/[^a-z0-9]+/g, " ").trim();
  for (const [rule, category] of CATEGORY_ALIASES) if (rule.test(raw)) return category;

  const fallback = slugifyCategory(input.fallback ?? "");
  return slugifyCategory(raw) || fallback || "diger";
}
