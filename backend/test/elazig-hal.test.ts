import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { parseElazigHal, priceFingerprint } from '../src/modules/etl/sources/municipality/elazig';

const html = readFileSync(new URL('./fixtures/elazig-hal/2026-09-08.html', import.meta.url), 'utf8');

test('yalniz fiyati olan satirlar alinir; 0 = kotasyon yok', () => {
  const rows = parseElazigHal(html);
  // Sayfada 129 kayit var, yarisindan cogu 0,00 ile "fiyat bekleniyor" demek.
  expect(rows.length).toBeGreaterThan(40);
  expect(rows.length).toBeLessThan(129);
  expect(rows.every((r) => r.min! > 0 && r.max! > 0)).toBe(true);
});

test('kaynak hatasi olan ters satir (min > maks) atilir', () => {
  const rows = parseElazigHal(html);
  expect(rows.every((r) => r.max! >= r.min!)).toBe(true);
  // Canlida "Biber (Kırmızı Kapya)" min 350,00 / maks 75,00 geliyordu.
  expect(rows.find((r) => /Kırmızı Kapya/.test(r.name))).toBeUndefined();
});

test('ayni sayfadaki iki ondalik ayirici da okunur', () => {
  // Kaynak "60.00" ve "88,00" biciminde ikisini birden kullaniyor.
  const rows = parseElazigHal(html);
  const armut = rows.find((r) => /Armut/i.test(r.name));
  expect(armut).toBeDefined();
  expect([armut!.min, armut!.max]).toEqual([60, 88]);
  const ananas = rows.find((r) => /Ananas/i.test(r.name));
  expect([ananas!.min, ananas!.max]).toEqual([140, 150]);
});

test('ortalama uretilmez, birim kg', () => {
  const rows = parseElazigHal(html);
  expect(rows.every((r) => r.avg === null && r.unit === 'kg')).toBe(true);
});

test('liste yoksa veya fiyat yoksa sessizce bos donmez', () => {
  expect(() => parseElazigHal('<html><body>bos</body></html>')).toThrow(/halfiyat listesi bulunamadi/);
  expect(() => parseElazigHal('<ul id="halfiyat"><li><h4 class="default-title">X</h4><div class="price">0,00</div><div class="price">0,00</div></li></ul>'))
    .toThrow(/gecerli fiyat satiri yok/);
});

test('parmak izi sayfa donmasini yakalar, satir sirasindan etkilenmez', () => {
  const a = [{ min: 10, max: 20 }, { min: 30, max: 40 }];
  const reordered = [{ min: 30, max: 40 }, { min: 10, max: 20 }];
  const changed = [{ min: 10, max: 20 }, { min: 30, max: 41 }];
  expect(priceFingerprint(a)).toBe(priceFingerprint(reordered));
  expect(priceFingerprint(a)).not.toBe(priceFingerprint(changed));
  // Satir sayisi degisirse de farkli olmali (alt kume tuzagi).
  expect(priceFingerprint(a)).not.toBe(priceFingerprint([{ min: 10, max: 20 }]));
});

test('gercek sayfanin parmak izi kararli', () => {
  const rows = parseElazigHal(html);
  expect(priceFingerprint(rows)).toBe(priceFingerprint(parseElazigHal(html)));
});
