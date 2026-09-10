"use client";
import {useState} from 'react';
import type {Listing} from '@/lib/api';
import {apiDelete,apiPost,ApiError} from '@/lib/api-client';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';

export function OwnerListingLifecycle({item,onRenewed,onDeleted}:{item:Listing;onRenewed:()=>void;onDeleted:()=>void}) {
  const [mode,setMode]=useState<'renew'|'delete'|null>(null);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
  const minDate=item.validUntil>=tomorrow?new Date(new Date(`${item.validUntil.slice(0,10)}T00:00:00Z`).getTime()+86400000).toISOString().slice(0,10):tomorrow;
  async function act(date?:string){
    setBusy(true);setError('');
    try {
      if(date){await apiPost(`/listings/${item.id}/renew`,{validUntil:date});setMode(null);onRenewed();}
      else {await apiDelete(`/listings/${item.id}`);onDeleted();}
    } catch(e){setError(e instanceof ApiError?(e.details as {error?:{message?:string}})?.error?.message || 'İşlem tamamlanamadı. Tekrar deneyin.':'Bağlantı kurulamadı. Tekrar deneyin.');} finally{setBusy(false);}
  }
  return <div className="space-y-3 border-t border-(--color-border-soft) p-4">
    <p className="text-sm">Son tarih: <strong>{item.validUntil?.slice(0,10).split('-').reverse().join('.')}</strong></p>
    <div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" disabled={busy} aria-expanded={mode==='renew'} onClick={()=>{setError('');setMode(mode==='renew'?null:'renew');}}>Süreyi uzat</Button><Button type="button" variant="secondary" disabled={busy} aria-expanded={mode==='delete'} onClick={()=>{setError('');setMode(mode==='delete'?null:'delete');}}>İlanı sil</Button></div>
    {mode==='renew' && <form className="space-y-3 rounded-lg border border-(--color-border) p-4" onSubmit={e=>{e.preventDefault();void act(String(new FormData(e.currentTarget).get('date')));}}>
      <Input label="Yeni son tarih" name="date" type="date" required min={minDate} defaultValue={new Date(Math.max(Date.now(),new Date(`${item.validUntil.slice(0,10)}T00:00:00Z`).getTime())+7*86400000).toISOString().slice(0,10)} disabled={busy}/>
      <p className="text-sm text-(--color-muted)">İlan yeni tarihle tekrar onaya gönderilir. Son teklif tarihi de değişir; teklifler yeni son tarihten sonra açılır.</p>
      <Button type="submit" loading={busy}>Süreyi uzat ve onaya gönder</Button>
    </form>}
    {mode==='delete' && <div className="space-y-3 rounded-lg border border-(--color-danger) p-4" role="group" aria-label="İlan silme onayı">
      <p className="text-sm"><strong>{item.title}</strong> ilanını silmek istiyor musunuz? İlan yayından ve İlanlarım listesinden kaldırılır. Etkin öne çıkarma durur.</p>
      <div className="flex flex-wrap gap-3"><Button type="button" loading={busy} onClick={()=>void act()}>Evet, ilanı sil</Button><Button type="button" variant="secondary" disabled={busy} onClick={()=>setMode(null)}>Vazgeç</Button></div>
    </div>}
    {error && <p role="alert" className="text-sm text-(--color-danger)">{error}</p>}
  </div>;
}
