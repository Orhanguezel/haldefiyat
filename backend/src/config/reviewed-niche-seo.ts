/** 2026-09-14: reviewed product identities with naturally narrow wholesale coverage.
 * Keep editorial + quality + recent observations gates; never a permanent index override.
 * E. Kulak is deliberately excluded until its source identity is verified.
 */
export const REVIEWED_NICHE_SLUGS = [
  'kekik-yas-taze', 'tatli-patates', 'defne-yapragi-yas-taze', 'istakoz', 'tarhun',
] as const;
export const REVIEWED_NICHE_MIN_DAYS = 4;
export const REVIEWED_NICHE_MIN_QUALITY = 65;
export function isReviewedNicheEligible(slug: string, quality: number, days30: number, halMarkets: number): boolean {
  return (REVIEWED_NICHE_SLUGS as readonly string[]).includes(slug)
    && quality >= REVIEWED_NICHE_MIN_QUALITY && days30 >= REVIEWED_NICHE_MIN_DAYS && halMarkets >= 1;
}
