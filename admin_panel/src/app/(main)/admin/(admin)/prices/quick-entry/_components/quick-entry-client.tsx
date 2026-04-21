'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAutocompleteHfProductsQuery } from '@/integrations/endpoints/hf-products-admin-endpoints';
import { useAutocompleteMarketsQuery } from '@/integrations/endpoints/markets-admin-endpoints';
import { useBulkCreatePricesAdminMutation } from '@/integrations/endpoints/prices-admin-endpoints';
import type { BulkPriceEntry } from '@/integrations/endpoints/prices-admin-endpoints';

type EntryRow = {
  key: number;
  productId: number | null;
  productName: string;
  marketId: number | null;
  marketName: string;
  avgPrice: string;
  minPrice: string;
  maxPrice: string;
  recordedDate: string;
};

type AutocompleteFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (id: number, label: string) => void;
  results: { id: number; label: string }[];
  loading: boolean;
  placeholder?: string;
};

function AutocompleteField({ label, value, onChange, onSelect, results, loading, placeholder }: AutocompleteFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder ?? `${label} ara...`}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-8 text-xs mt-1"
      />
      {open && (value.length > 0) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-xs text-muted-foreground">Yükleniyor...</div>}
          {!loading && results.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">Sonuç yok</div>}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
              onMouseDown={() => { onSelect(r.id, r.label); setOpen(false); }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyRow(key: number): EntryRow {
  return { key, productId: null, productName: '', marketId: null, marketName: '', avgPrice: '', minPrice: '', maxPrice: '', recordedDate: today() };
}

export default function QuickEntryClient() {
  const [rows, setRows] = useState<EntryRow[]>([emptyRow(0)]);
  const [submitted, setSubmitted] = useState<{ inserted: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [productQ, setProductQ] = useState('');
  const [marketQ, setMarketQ] = useState('');

  const { data: productData, isFetching: productFetching } = useAutocompleteHfProductsQuery(productQ, { skip: productQ.length < 2 });
  const { data: marketData, isFetching: marketFetching } = useAutocompleteMarketsQuery(marketQ, { skip: marketQ.length < 2 });

  const [bulkCreate, { isLoading }] = useBulkCreatePricesAdminMutation();

  const updateRow = useCallback((key: number, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r) => r.key === key ? { ...r, ...patch } : r));
  }, []);

  const addRow = () => setRows((prev) => [...prev, emptyRow(Date.now())]);

  const removeRow = (key: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleSubmit = async () => {
    setError(null);
    const valid = rows.filter((r) => r.productId && r.marketId && r.avgPrice && r.recordedDate);
    if (valid.length === 0) { setError('En az bir geçerli satır gerekli (ürün, hal, fiyat, tarih).'); return; }

    const entries: BulkPriceEntry[] = valid.map((r) => ({
      productId: r.productId!,
      marketId: r.marketId!,
      avgPrice: parseFloat(r.avgPrice),
      minPrice: r.minPrice ? parseFloat(r.minPrice) : undefined,
      maxPrice: r.maxPrice ? parseFloat(r.maxPrice) : undefined,
      recordedDate: r.recordedDate,
      sourceApi: 'manual',
    }));

    try {
      const result = await bulkCreate({ entries }).unwrap();
      setSubmitted({ inserted: result.inserted, skipped: result.skipped });
      setRows([emptyRow(Date.now())]);
    } catch {
      setError('Kayıt sırasında hata oluştu.');
    }
  };

  const productOptions = (productData?.items ?? []).map((p) => ({ id: p.id, label: `${p.nameTr} (${p.unit})` }));
  const marketOptions = (marketData?.items ?? []).map((m) => ({ id: m.id, label: `${m.name} — ${m.cityName}` }));

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hızlı Fiyat Girişi</CardTitle>
          <CardDescription>Birden fazla ürün fiyatını tek seferde girin. Ürün ve hal adını yazarak arama yapın.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row, idx) => (
            <div key={row.key} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Satır {idx + 1}</span>
                {rows.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => removeRow(row.key)}>
                    Sil
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AutocompleteField
                  label="Ürün"
                  value={row.productName}
                  onChange={(v) => { updateRow(row.key, { productName: v, productId: null }); setProductQ(v); }}
                  onSelect={(id, label) => updateRow(row.key, { productId: id, productName: label })}
                  results={productOptions}
                  loading={productFetching}
                  placeholder="Domates, Patates..."
                />
                <AutocompleteField
                  label="Hal"
                  value={row.marketName}
                  onChange={(v) => { updateRow(row.key, { marketName: v, marketId: null }); setMarketQ(v); }}
                  onSelect={(id, label) => updateRow(row.key, { marketId: id, marketName: label })}
                  results={marketOptions}
                  loading={marketFetching}
                  placeholder="İzmir, Ankara..."
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Ort. Fiyat (₺) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.avgPrice}
                    onChange={(e) => updateRow(row.key, { avgPrice: e.target.value })}
                    placeholder="12.50"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Min Fiyat (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.minPrice}
                    onChange={(e) => updateRow(row.key, { minPrice: e.target.value })}
                    placeholder="10.00"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Fiyat (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.maxPrice}
                    onChange={(e) => updateRow(row.key, { maxPrice: e.target.value })}
                    placeholder="15.00"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tarih *</Label>
                  <Input
                    type="date"
                    value={row.recordedDate}
                    onChange={(e) => updateRow(row.key, { recordedDate: e.target.value })}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              {(row.productId || row.marketId) && (
                <div className="flex gap-2 flex-wrap">
                  {row.productId && <Badge variant="secondary" className="text-xs">Ürün #{row.productId}</Badge>}
                  {row.marketId && <Badge variant="secondary" className="text-xs">Hal #{row.marketId}</Badge>}
                </div>
              )}
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow} className="text-xs">
            + Satır Ekle
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {submitted && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-4 text-sm text-green-800 dark:text-green-400">
          <strong>{submitted.inserted} kayıt eklendi.</strong>
          {submitted.skipped > 0 && ` ${submitted.skipped} satır atlandı (hata veya mükerrer).`}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isLoading} className="text-sm">
          {isLoading ? 'Kaydediliyor...' : `${rows.filter((r) => r.productId && r.marketId && r.avgPrice).length} kaydı Kaydet`}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          onClick={() => { setRows([emptyRow(Date.now())]); setSubmitted(null); setError(null); }}
        >
          Temizle
        </Button>
      </div>
    </div>
  );
}
