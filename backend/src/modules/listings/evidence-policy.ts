/** Explicit rehearsal labels and internal flags cannot enter the public market. */
export function realListingSql(alias = "hf_listings"): string {
  if (!/^[a-z_]+$/.test(alias)) throw new Error("INVALID_LISTING_ALIAS");
  return `JSON_EXTRACT(${alias}.raw, '$.ownerDeletedAt') IS NULL
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${alias}.raw, '$.isTest')), 'false') NOT IN ('true','1')
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${alias}.raw, '$.isDemo')), 'false') NOT IN ('true','1')
    AND NOT (UPPER(TRIM(COALESCE(${alias}.description, ''))) REGEXP '^(PROVA ILANI|PROVA İLANI|TEST ILANI|TEST İLANI|DEMO ILANI|DEMO İLANI)')`;
}
