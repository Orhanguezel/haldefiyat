import { getAliasMap, turkishToAscii } from "@/modules/etl/normalizer";
import { slugifyTr, TURKEY_CITIES } from "@/data/turkey-city-slugs";
import { createListing } from "./repo";

type Parsed = { ok: true; id?: number } | { ok: false; reason: string };

const QTY_RE = /(\d+(?:[.,]\d+)?)\s*(ton|kg|kasa|adet|çuval|cuval|kg\/kasa)/i;
const PRICE_RE = /(\d+(?:[.,]\d+)?)\s*(tl|₺)/i;

function num(raw?: string) {
  return raw ? Number(raw.replace(",", ".")) : undefined;
}

function listingType(text: string) {
  return /alıyorum|alim|alım|alacağım|alacagim/i.test(text) ? "alim" : "satis";
}

async function findProduct(text: string) {
  const normalized = turkishToAscii(text);
  const aliases = await getAliasMap();
  for (const [alias, slug] of aliases.entries()) {
    if (alias.length >= 3 && normalized.includes(alias)) return slug;
  }
  return null;
}

function findCity(text: string) {
  const normalized = turkishToAscii(text);
  for (const city of TURKEY_CITIES) {
    const slug = slugifyTr(city.label);
    if (normalized.includes(slug)) return slug;
  }
  return null;
}

export async function parseTelegramListing(input: {
  text: string;
  chatId: number;
  from?: { first_name?: string; username?: string };
}): Promise<Parsed> {
  const text = input.text.trim();
  const hasIntent = /ilan|satıyorum|satiyorum|satılık|satilik|alıyorum|alacağım|alim|alım|\d+\s*(ton|kg|kasa)|tl|₺/i.test(text);
  if (!hasIntent) return { ok: false, reason: "not_listing" };
  const [productSlug, citySlug] = await Promise.all([findProduct(text), Promise.resolve(findCity(text))]);
  if (!productSlug || !citySlug) return { ok: false, reason: "missing_product_or_city" };
  const qty = QTY_RE.exec(text);
  const price = PRICE_RE.exec(text);
  const title = `${productSlug} ${citySlug} ${listingType(text) === "alim" ? "alım talebi" : "satış ilanı"}`;
  const validUntil = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);
  const item = await createListing({
    listingType: listingType(text),
    partyRole: listingType(text) === "alim" ? "alici" : "uretici",
    productSlug,
    productName: productSlug,
    title,
    citySlug,
    quantity: num(qty?.[1]) ?? null,
    quantityUnit: qty?.[2]?.replace("cuval", "çuval") ?? "kg",
    priceType: price ? "sabit" : "pazarlik",
    priceMin: num(price?.[1]) ?? null,
    priceUnit: "kg",
    currency: "TRY",
    validUntil,
    contactName: input.from?.username ?? input.from?.first_name ?? "Telegram",
    hidePhone: false,
    description: text,
  }, null, {
    source: "telegram",
    status: "pending",
    raw: { telegram_chat_id: input.chatId, telegram_from: input.from ?? null, text },
  });
  return { ok: true, id: item?.id };
}
