import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VariantPriceTable from './VariantPriceTable';
import { fetchVariantPrices } from '@/lib/api';
vi.mock('@/lib/api', () => ({ fetchVariantPrices: vi.fn() }));
afterEach(cleanup);
const row = { slug: 'domates-sera', displayName: 'Domates Sera', unit: 'kg', avgPrice: 25, marketCount: 2, yoyPct: null };
describe('variant comparison visibility', () => {
 it('keeps current prices without an empty yearly column or warning', async () => {
  vi.mocked(fetchVariantPrices).mockResolvedValue([row] as never);
  render(await VariantPriceTable({masterSlug:'domates',productName:'Domates',variantCount:1}));
  expect(screen.queryByText('Geçen yıl aynı dönem')).toBeNull();
  expect(screen.queryByText(/Mayıs 2027|Veri birikiyor/)).toBeNull();
  expect(screen.getByText('₺25,00')).toBeTruthy();
 });
 it('shows the actual prior-year price instead of a percentage', async () => {
  vi.mocked(fetchVariantPrices).mockResolvedValue([{...row,yoyPct:25,priorYearAvgPrice:20},{...row,slug:'domates-diger',displayName:'Domates Diğer'}] as never);
  render(await VariantPriceTable({masterSlug:'domates',productName:'Domates',variantCount:2}));
  expect(screen.getByText('Geçen yıl aynı dönem')).toBeTruthy();
  expect(screen.getByText('₺20,00')).toBeTruthy();
  expect(screen.getByText('—')).toBeTruthy();
  expect(screen.queryByText('25%')).toBeNull();
 });
});
