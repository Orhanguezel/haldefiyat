import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { parseAntalyaHalText } from '../src/modules/etl/sources/municipality/antalya';

const text = readFileSync(new URL('./fixtures/antalya-hal/2026-09-08.txt', import.meta.url), 'utf8');

test('bulten tarihi istekten degil belgeden gelir', () => {
  const rows = parseAntalyaHalText(text);
  expect(rows.every((r) => r.recordedDate === '2026-09-08')).toBe(true);
});

test('iki sutunlu duzenin her iki tarafi da okunur', () => {
  const rows = parseAntalyaHalText(text);
  // Birim dagilimi PDF'teki sayimla birebir: 70 Kg + 10 Bag + 7 Adet.
  expect(rows).toHaveLength(87);
  const units = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.unit!] = (acc[r.unit!] ?? 0) + 1;
    return acc;
  }, {});
  expect(units).toEqual({ kg: 70, bag: 10, adet: 7 });
});

test('kategori sutun yarisina gore atanir — sol SEBZELER, sag MEYVELER/ITHAL', () => {
  const rows = parseAntalyaHalText(text);
  const find = (name: string) => rows.find((r) => r.name.includes(name));
  expect(find('Biber(Dolma)')!.category).toBe('sebze');
  expect(find('Turp (Kırmızı)')!.category).toBe('sebze');
  expect(find('Elma (Golden)')!.category).toBe('meyve');
  // Ithal urunler sag sutunda MEYVELER'den sonra gelir.
  expect(find('Frenk Üzümü')!.category).toBe('meyve');
});

test('binlik ayirici ile ondalik virgul karistirilmaz', () => {
  const rows = parseAntalyaHalText(text);
  const frenk = rows.find((r) => r.name.includes('Frenk Üzümü'))!;
  expect([frenk.min, frenk.max]).toEqual([800, 1520]);
  const ahududu = rows.find((r) => r.name.includes('Ahududu'))!;
  expect([ahududu.min, ahududu.max]).toEqual([800, 1040]);
});

test('ortalama uretilmez; min/max ham birakilir', () => {
  const rows = parseAntalyaHalText(text);
  expect(rows.every((r) => r.avg === null && r.min! > 0 && r.max! >= r.min!)).toBe(true);
});

test('tarihsiz veya fiyatsiz belge sessizce bos donmez', () => {
  expect(() => parseAntalyaHalText('ANTALYA TOPTANCI HALİ')).toThrow(/tarih bulunamadi/);
  expect(() => parseAntalyaHalText('GÜNLÜK FİYAT LİSTESİ 08.09.2026\n(tablo yok)')).toThrow(/gecerli fiyat satiri yok/);
});

test('gecersiz takvim tarihi reddedilir', () => {
  expect(() => parseAntalyaHalText('GÜNLÜK FİYAT LİSTESİ 31.02.2026')).toThrow(/gecersiz tarih/);
});
