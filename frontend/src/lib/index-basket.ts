// Endeks sepet ürünleri — backend'deki INDEX_BASKET_SLUGS ile senkron tutulmalı
export const INDEX_BASKET: { slug: string; label: string }[] = [
  { slug: "domates",   label: "Domates" },
  { slug: "biber",     label: "Biber" },
  { slug: "patlican",  label: "Patlıcan" },
  { slug: "salatalik", label: "Salatalık" },
  { slug: "patates",   label: "Patates" },
  { slug: "sogan",     label: "Soğan" },
  { slug: "havuc",     label: "Havuç" },
  { slug: "marul",     label: "Marul" },
  { slug: "kabak",     label: "Kabak" },
  { slug: "brokoli",   label: "Brokoli" },
  { slug: "elma",      label: "Elma" },
  { slug: "portakal",  label: "Portakal" },
  { slug: "limon",     label: "Limon" },
  { slug: "uzum",      label: "Üzüm" },
  { slug: "muz",       label: "Muz" },
];

export const INDEX_BASKET_SLUGS  = INDEX_BASKET.map((p) => p.slug);
export const INDEX_BASKET_LABELS = INDEX_BASKET.map((p) => p.label);
