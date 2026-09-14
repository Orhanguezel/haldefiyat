import { describe, expect, test } from 'bun:test';
import { isReviewedNicheEligible } from '../src/config/reviewed-niche-seo';
describe('reviewed narrow-coverage product eligibility', () => {
  test('accepts reviewed specialists without three markets or alias bonus', () => {
    expect(isReviewedNicheEligible('tatli-patates', 65, 31, 2)).toBe(true);
    expect(isReviewedNicheEligible('defne-yapragi-yas-taze', 75, 4, 1)).toBe(true);
  });
  test('does not bypass identity, freshness, quality or hal coverage', () => {
    expect(isReviewedNicheEligible('e-kulak', 100, 31, 2)).toBe(false);
    expect(isReviewedNicheEligible('istakoz', 75, 0, 1)).toBe(false);
    expect(isReviewedNicheEligible('istakoz', 75, 3, 1)).toBe(false);
    expect(isReviewedNicheEligible('istakoz', 60, 8, 1)).toBe(false);
    expect(isReviewedNicheEligible('istakoz', 75, 8, 0)).toBe(false);
  });
});
