import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { parseAdanaBulletin, adanaBulletinLinks } from '../src/modules/etl/sources/municipality/adana';
const html = readFileSync(new URL('./fixtures/competitor-seo/adana-2026-09-07.html', import.meta.url), 'utf8');
test('official prices retain document date, decimals and variety; zero quotes excluded', () => {
  const rows = parseAdanaBulletin(html);
  expect(rows.length).toBeGreaterThan(30);
  expect(rows.every(r => r.recordedDate === '2026-09-07' && r.min > 0 && r.avg === null)).toBe(true);
  const mayer = rows.find(r => /MAYER/.test(r.name));
  expect(mayer).toBeDefined();
  expect(mayer!.unit).toBe('kg');
  expect([mayer!.min, mayer!.max]).toEqual([25, 30]);
  expect(rows.every(r => r.max < 1000)).toBe(true);
});
test('soft 404 or undated bulletin cannot be stamped as today', () => {
  expect(() => parseAdanaBulletin('404 Sayfa bulunamadı')).toThrow();
  expect(() => parseAdanaBulletin(html.replaceAll('07/09/2026', '31/02/2026'))).toThrow();
});
test('archive link extraction stays on municipality origin', () => {
 expect(adanaBulletinLinks('<a href="https://evil.test/tr/hal-detay/1">x</a><a href="/tr/hal-detay/2701">x</a>', 'https://www.adana.bel.tr')).toEqual(['https://www.adana.bel.tr/tr/hal-detay/2701']);
});
