'use client';

import { AlertCircle, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, STATUS_LABEL } from '../_lib/api';
import type { AdForm, AdRow, AdSlot, EditForm, Inquiry, Listing, Pricing } from '../_lib/types';
import { AdPlanner } from './ad-planner';
import { ListingDetails } from './listing-details';
import { ListingImages } from './listing-images';

type Props = {
  listing: Listing | null;
  form: EditForm | null;
  onField: <K extends keyof EditForm>(key: K, value: EditForm[K]) => void;
  images: string[];
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  onRemoveImage: (url: string) => void;
  onMakeCover: (url: string) => void;
  adForm: AdForm;
  onAdChange: (patch: Partial<AdForm>) => void;
  slots: AdSlot[];
  ads: AdRow[];
  currentAdId?: number;
  pricing: Pricing | null;
  inquiries: Inquiry[];
  error: string;
  saving: boolean;
  onSave: () => void;
  onModerate: (status: 'approved' | 'rejected') => void;
  onClose: () => void;
};

export function ListingSheet(props: Props) {
  const { listing, form, adForm, inquiries } = props;
  const open = Boolean(listing && form);

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) props.onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {listing && form ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">{form.title || `İlan #${listing.id}`}</SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={listing.status === 'approved' ? 'default' : listing.status === 'rejected' ? 'destructive' : 'secondary'} className="font-normal">
                      {STATUS_LABEL[listing.status] ?? listing.status}
                    </Badge>
                    <span>#{listing.id}</span>
                    <span aria-hidden>·</span>
                    <span>{listing.productName}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(listing.validUntil)} sonuna kadar</span>
                  </SheetDescription>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="outline" disabled={listing.status === 'approved'} onClick={() => props.onModerate('approved')}>
                    <Check className="size-3.5" /> Onayla
                  </Button>
                  <Button size="sm" variant="outline" disabled={listing.status === 'rejected'} onClick={() => props.onModerate('rejected')}>
                    <X className="size-3.5" /> Reddet
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3">
                <TabsList>
                  <TabsTrigger value="details">Detaylar</TabsTrigger>
                  <TabsTrigger value="images">Görseller {props.images.length ? `(${props.images.length})` : ''}</TabsTrigger>
                  <TabsTrigger value="ad">Reklam {adForm.enabled ? '·' : ''}</TabsTrigger>
                  <TabsTrigger value="inquiries">Teklifler {inquiries.length ? `(${inquiries.length})` : ''}</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="details" className="mt-0">
                  <ListingDetails form={form} listing={listing} onChange={props.onField} />
                </TabsContent>
                <TabsContent value="images" className="mt-0">
                  <ListingImages
                    images={props.images}
                    uploading={props.uploading}
                    onUpload={props.onUpload}
                    onRemove={props.onRemoveImage}
                    onMakeCover={props.onMakeCover}
                  />
                </TabsContent>
                <TabsContent value="ad" className="mt-0">
                  <AdPlanner
                    value={adForm}
                    onChange={props.onAdChange}
                    slots={props.slots}
                    ads={props.ads}
                    currentAdId={props.currentAdId}
                    pricing={props.pricing}
                    listingTitle={form.title}
                    coverImage={props.images[0]}
                  />
                </TabsContent>
                <TabsContent value="inquiries" className="mt-0 space-y-2">
                  {inquiries.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Bu ilana gelen teklif yok.</p>
                  ) : inquiries.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{item.name ?? 'İsimsiz'}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {item.phone ?? 'telefon yok'} · {item.offerPrice ? `${item.offerPrice} ₺ teklif` : 'teklif yok'}
                      </div>
                      {item.message ? <p className="mt-2 text-muted-foreground">{item.message}</p> : null}
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>

            <SheetFooter className="border-t px-6 py-3">
              {props.error ? (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{props.error}</span>
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={props.onClose}>Vazgeç</Button>
                <Button onClick={props.onSave} disabled={props.saving || props.uploading}>
                  {props.saving ? 'Kaydediliyor…' : 'Kaydet'}
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
