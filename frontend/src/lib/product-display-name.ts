function titleCaseTr(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .split(/(\s|\(|\)|-|,)/)
    .map((part) => {
      if (!part || /^\s+$/u.test(part) || /^[()\-,]+$/u.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1);
    })
    .join("")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

function hasMeaningfulQualifier(value: string) {
  return /\([^)]*[0-9A-Za-zÇĞİÖŞÜçğıöşü][^)]*\)/u.test(value);
}

export function getProductDisplayName(product: { displayName?: string | null; nameTr: string }) {
  const configured = product.displayName?.trim();
  // Anlamlı varyantı koru; ETL placeholder'ını temiz display_name'in üzerine yazma.
  const value = (hasMeaningfulQualifier(product.nameTr) && !(configured && hasMeaningfulQualifier(configured))
    ? product.nameTr
    : configured || product.nameTr)
    .replace(/\s*\(\s*\.{3}\s*\)\s*/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const letters = value.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/gu, "");
  const isAllCaps = letters.length > 1 && letters === letters.toLocaleUpperCase("tr-TR");
  return isAllCaps ? titleCaseTr(value) : value;
}
