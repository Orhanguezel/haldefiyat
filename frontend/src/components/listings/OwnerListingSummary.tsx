"use client";
import Link from "next/link";
import type { Listing } from "@/lib/api";

export function listingIsExpired(item: Pick<Listing,'validUntil'>) { return item.validUntil?.slice(0,10) < new Date().toISOString().slice(0,10); }
export function OwnerListingSummary({item,detail=false}:{item:Listing;detail?:boolean}) {
  const live=item.status==='approved'&&!listingIsExpired(item)&&!item.visibilityReason;
  const href=`/hesabim/ilanlarim/${item.id}`;
  const photos=detail?item.images:item.images?.slice(0,1);
  return <div className="space-y-3">
    {photos?.length ? <div className={detail?'grid grid-cols-2 gap-3':'max-w-sm'}>{photos.map((url,index)=><Link href={href} key={`${url}-${index}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`${item.title} fotoğraf ${index+1}`} width={380} height={240} className="aspect-[4/3] w-full rounded-lg object-cover"/>
    </Link>)}</div>:null}
    <Link href={href} className="block text-lg font-semibold">{item.title}</Link>
    <p className="text-sm text-(--color-muted)">{item.productName} · {item.citySlug || 'Konum belirtilmedi'}{item.districtSlug?` / ${item.districtSlug}`:''}</p>
    <div className="grid grid-cols-2 gap-3 text-sm"><p>Miktar: <strong>{item.quantity?`${item.quantity} ${item.quantityUnit}`:'Belirtilmedi'}</strong></p><p>Fiyat: <strong>{item.priceType==='pazarlik'?'Pazarlık':item.priceMin?`${item.priceMin}${item.priceMax?`–${item.priceMax}`:''} TL/${item.priceUnit}`:'Belirtilmedi'}</strong></p></div>
    {detail && <><p className="whitespace-pre-wrap break-words text-sm leading-6">{item.description || 'Açıklama eklenmemiş.'}</p><p className="text-sm">İletişim: {item.contactName || '—'} · {item.contactPhone || '—'}</p></>}
    {!live && <p className="rounded-lg bg-(--color-bg-alt) p-3 text-sm">{item.visibilityReason==='test'?'Bu kayıt test/prova ilanı olarak işaretlenmiş; genel yayında gösterilmez. Gerçek bir ilansa açıklamasını düzenleyip yeniden onaya gönderin.':listingIsExpired(item)?'İlanın süresi dolmuş.':'İlan şu anda yayında değil.'} Bu görünümü yalnız siz görebilirsiniz. Yeniden yayın için bilgilerinizi ve son tarihi kontrol edin.</p>}
    <div className="flex flex-wrap gap-3">
      {!detail && <Link href={href} className="inline-flex min-h-11 items-center rounded-lg bg-(--color-brand) px-4 text-sm font-semibold text-(--color-brand-fg)">İlanı incele</Link>}
      {live && <Link href={`/ilan/${item.slug}`} className="inline-flex min-h-11 items-center rounded-lg border border-(--color-border) px-4 text-sm">Yayındaki ilanı aç</Link>}
    </div>
  </div>;
}
