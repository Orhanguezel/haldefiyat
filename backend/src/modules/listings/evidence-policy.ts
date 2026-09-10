/** Explicit rehearsal labels and internal flags cannot enter the public market. */
export function realListingSql(alias = "hf_listings"): string {
  if (!/^[a-z_]+$/.test(alias)) throw new Error("INVALID_LISTING_ALIAS");
  return `JSON_EXTRACT(${alias}.raw, '$.ownerDeletedAt') IS NULL
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${alias}.raw, '$.isTest')), 'false') NOT IN ('true','1')
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${alias}.raw, '$.isDemo')), 'false') NOT IN ('true','1')
    AND NOT (UPPER(TRIM(COALESCE(${alias}.description, ''))) REGEXP '^(PROVA ILANI|PROVA İLANI|TEST ILANI|TEST İLANI|DEMO ILANI|DEMO İLANI)')`;
}

/** Explain the same public visibility rules to the authenticated owner. */
export function ownerVisibilityReason(item: {status:string;validUntil:string;description?:string|null;raw?:Record<string,unknown>|null}) {
  if(item.raw?.ownerDeletedAt)return 'deleted';
  if(['true','1'].includes(String(item.raw?.isTest)) || ['true','1'].includes(String(item.raw?.isDemo)) || /^(PROVA ILANI|PROVA İLANI|TEST ILANI|TEST İLANI|DEMO ILANI|DEMO İLANI)/i.test((item.description ?? '').trim()))return 'test';
  if(item.status!=='approved')return item.status;
  if(item.validUntil<new Date().toISOString().slice(0,10))return 'expired';
  return null;
}
