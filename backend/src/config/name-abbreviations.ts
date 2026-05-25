export type NameAbbreviationRule = {
  pattern: string;
  replacement: string;
};

export const PRODUCT_NAME_ABBREVIATIONS: NameAbbreviationRule[] = [
  { pattern: "^Y(?:\\.|\\s)+\\s*", replacement: "Yeşil " },
  { pattern: "^T(?:\\.|\\s)+\\s*", replacement: "Taze " },
  { pattern: "^K\\.?\\s*Soğan$", replacement: "Kuru Soğan" },
  { pattern: "^Kir(?:\\.|\\s)+\\s*", replacement: "Kırmızı " },
  { pattern: "^Salk(?:\\.|\\s)+\\s*", replacement: "Salkım " },
  { pattern: "^Kiv(?:\\.|\\s)+\\s*", replacement: "Kıvırcık " },
  { pattern: "^S(?:\\.|\\s)+\\s*Kabak$", replacement: "Sakız Kabağı" },
  { pattern: "\\bS\\.?\\s*Maria\\b", replacement: "Santa Maria" },
  { pattern: "\\bW\\.?\\s*Murc\\w*", replacement: "Washington Murcott" },
  { pattern: "\\bSn\\.?$", replacement: "" },
];
