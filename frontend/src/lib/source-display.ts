const SOURCE_TYPE_LABELS: Record<string, string> = {
  municipality: "Belediye kaynağı",
  exchange: "Ticaret borsası",
  official: "Kamu kurumu",
  cooperative: "Kooperatif kaynağı",
  manual: "Editör doğrulamalı kayıt",
};

const SOURCE_KEY_LABELS: Array<[prefix: string, label: string]> = [
  ["ibb_istanbul", "İBB Açık Veri"],
  ["istanbul_ibb", "İstanbul Büyükşehir Belediyesi"],
  ["hal_gov_tr", "Ticaret Bakanlığı Hal Kayıt Sistemi"],
  ["tobb_borsa", "Ticaret Borsası"],
  ["tmo_", "Toprak Mahsulleri Ofisi"],
  ["izmir_", "İzmir Büyükşehir Belediyesi"],
  ["antalya_", "Antalya hal kaynağı"],
  ["ankara_", "Ankara Büyükşehir Belediyesi"],
  ["mersin_", "Mersin Büyükşehir Belediyesi"],
  ["konya_", "Konya Büyükşehir Belediyesi"],
  ["kayseri_", "Kayseri Büyükşehir Belediyesi"],
  ["eskisehir_", "Eskişehir Büyükşehir Belediyesi"],
  ["denizli_", "Denizli Büyükşehir Belediyesi"],
];

const RAW_KEY_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)+$/u;

export function sourceDisplayName(
  sourceName?: string | null,
  sourceApi?: string | null,
  fallback = "Resmî fiyat kaynağı",
): string {
  const name = sourceName?.trim();
  const key = sourceApi?.trim().toLocaleLowerCase("tr-TR") ?? "";
  if (name && name !== sourceApi && !RAW_KEY_PATTERN.test(name)) return name;

  const known = SOURCE_KEY_LABELS.find(([prefix]) => key.startsWith(prefix));
  return known?.[1] ?? fallback;
}

export function sourceCompactLabel(sourceName?: string | null, sourceApi?: string | null): string {
  const displayName = sourceDisplayName(sourceName, sourceApi);
  const key = sourceApi?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const safeNamedSource = Boolean(
    sourceName?.trim()
    && sourceName !== sourceApi
    && !RAW_KEY_PATTERN.test(sourceName.trim()),
  );
  if (key.startsWith("tobb_borsa_")) {
    return displayName.replace(/ Günlük Fiyatları$/u, "");
  }
  if (key.startsWith("tmo_")) return "TMO";
  if (key.startsWith("izmir_")) return "İzmir BB";
  if (key.startsWith("istanbul_") || key.startsWith("ibb_")) return "İBB";

  const place = key.split("_")[0];
  if (place && safeNamedSource) {
    return place.charAt(0).toLocaleUpperCase("tr-TR") + place.slice(1);
  }
  return displayName;
}

export function sourceTypeLabel(sourceType?: string | null): string {
  return SOURCE_TYPE_LABELS[sourceType?.trim().toLocaleLowerCase("tr-TR") ?? ""]
    ?? "Doğrulanabilir veri kaynağı";
}
