/**
 * Uygulama Route Sabitleri — Hal Fiyatlari
 */

export const routes = {
  home: "/",
  prices: "/fiyatlar",
  map: "/harita",
  embed: "/embed",
  press: "/basin",
  market: (slug: string) => `/hal/${slug}`,
  product: (slug: string) => `/urun/${slug}`,
  compare: "/karsilastirma",
  about: "/hakkimizda",
  contact: "/iletisim",
  privacy: "/gizlilik-politikasi",
} as const;

// Geriye uyumluluk icin
export const ROUTES = {
  home: "/",
  prices: { list: "/fiyatlar" },
  markets: {
    detail: (slug: string) => `/hal/${slug}`,
  },
  productPrice: {
    detail: (slug: string) => `/urun/${slug}`,
  },
  static: {
    compare: "/karsilastirma",
    map: "/harita",
    embed: "/embed",
    press: "/basin",
    about: "/hakkimizda",
    contact: "/iletisim",
    privacy: "/gizlilik-politikasi",
  },
} as const;
