import { expect, test } from 'bun:test';
import type { GooglePerformanceSnapshot } from '../src/modules/competitor-monitor/google-performance';
import { buildSeoOpportunities, completeOpportunityInputs } from '../src/modules/competitor-monitor/opportunities';

const metric = (impressions: number, clicks: number, position: number, page = 'https://haldefiyat.com/urun/limon') => ({
  impressions,
  clicks,
  position,
  ctr: impressions ? clicks / impressions : 0,
  page,
  pages: [{ impressions, clicks, position, ctr: impressions ? clicks / impressions : 0, page }],
});

const snapshot: GooglePerformanceSnapshot = {
  startDate: '2026-08-27',
  endDate: '2026-09-23',
  previousStartDate: '2026-07-30',
  previousEndDate: '2026-08-26',
  fetchedAt: '2026-09-25T00:00:00.000Z',
  status: 'ok',
  scope: { country: 'tur', device: 'MOBILE', type: 'web', dataState: 'final' },
  queries: {
    'adana limon fiyatları': metric(5_498, 55, 6.65),
    'konya hal fiyatları': metric(1_720, 104, 2.13, 'https://haldefiyat.com/hal/konya-hal'),
    'bursa hal fiyatları': metric(1_265, 88, 3.1, 'https://haldefiyat.com/hal/bursa-hal'),
  },
  previousQueries: {
    'adana limon fiyatları': metric(3_149, 21, 7.6),
    'konya hal fiyatları': metric(1_801, 51, 2.7, 'https://haldefiyat.com/hal/konya-hal'),
  },
};

test('high-demand low-CTR local query becomes P1 with an inspectable scenario', () => {
  const result = buildSeoOpportunities([{ query: 'adana limon fiyatları', our_position: 6 }], snapshot);
  expect(result.items[0]?.priority).toBe('p1');
  expect(result.items[0]?.signals).toContain('low_ctr');
  expect(result.items[0]?.signals).toContain('misaligned_page');
  expect(result.items[0]?.potentialClicksAt3Ctr).toBe(110);
});

test('strong top-three query is protected instead of presented as a problem', () => {
  const result = buildSeoOpportunities([{ query: 'konya hal fiyatları', our_position: 18 }], snapshot);
  expect(result.items[0]?.priority).toBe('protect');
  expect(result.items[0]?.signals).toContain('engine_gap');
});

test('summary recomputes CTR from clicks and impressions', () => {
  const result = buildSeoOpportunities([
    { query: 'adana limon fiyatları', our_position: 6 },
    { query: 'konya hal fiyatları', our_position: 18 },
  ], snapshot);
  expect(result.summary.impressions).toBe(7_218);
  expect(result.summary.clicks).toBe(159);
  expect(result.summary.ctr).toBeCloseTo(159 / 7_218);
});

test('a query with no SERP rows stays visible through the dated GSC scope', () => {
  const inputs = completeOpportunityInputs([
    { query: 'adana limon fiyatları', our_position: 6 },
    { query: 'konya hal fiyatları', our_position: 18 },
  ], snapshot, 3, ['bursa hal fiyatları']);
  const result = buildSeoOpportunities(inputs, snapshot);
  expect(inputs).toContainEqual({ query: 'bursa hal fiyatları', our_position: null });
  expect(result.summary.queries).toBe(3);
  expect(result.summary.impressions).toBe(8_483);
});
