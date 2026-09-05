'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PRICE_TYPES } from '../_lib/api';
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;
import type { EditForm, Listing } from '../_lib/types';

type Props = {
  form: EditForm;
  listing: Listing;
  onChange: <K extends keyof EditForm>(key: K, value: EditForm[K]) => void;
  t: T;
};

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ListingDetails({ form, listing, onChange, t }: Props) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">{t('details.listingNo')}</dt><dd className="font-medium">#{listing.id}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t('details.product')}</dt><dd className="truncate font-medium">{listing.productName}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t('details.city')}</dt><dd className="font-medium">{listing.citySlug ?? 'TR'}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t('details.type')}</dt><dd className="font-medium">{listing.listingType === 'alim' ? t('type.alimLong') : t('type.satisLong')}</dd></div>
      </dl>

      <Row label={t('details.title')}>
        <Input value={form.title} onChange={(event) => onChange('title', event.target.value)} />
      </Row>

      <div className="grid gap-4 sm:grid-cols-2">
        <Row label={t('details.validUntil')} hint={t('details.validHint')}>
          <Input type="date" value={form.validUntil} onChange={(event) => onChange('validUntil', event.target.value)} />
        </Row>
        <Row label={t('details.phone')}>
          <Input value={form.contactPhone} onChange={(event) => onChange('contactPhone', event.target.value)} />
        </Row>
        <Row label={t('details.quantity')}>
          <Input type="number" step="0.01" value={form.quantity} onChange={(event) => onChange('quantity', event.target.value)} />
        </Row>
        <Row label={t('details.quantityUnit')}>
          <Input value={form.quantityUnit} onChange={(event) => onChange('quantityUnit', event.target.value)} />
        </Row>
        <Row label={t('details.priceType')}>
          <Select value={form.priceType} onValueChange={(value) => onChange('priceType', value)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRICE_TYPES.map((option) => (
                <SelectItem key={option} value={option}>{t(`details.priceTypes.${option}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label={t('details.priceMin')}>
            <Input type="number" step="0.01" value={form.priceMin} onChange={(event) => onChange('priceMin', event.target.value)} />
          </Row>
          <Row label={t('details.priceMax')}>
            <Input type="number" step="0.01" value={form.priceMax} onChange={(event) => onChange('priceMax', event.target.value)} />
          </Row>
        </div>
      </div>

      <Row label={t('details.description')}>
        <Textarea rows={6} value={form.description} onChange={(event) => onChange('description', event.target.value)} />
      </Row>
    </div>
  );
}
