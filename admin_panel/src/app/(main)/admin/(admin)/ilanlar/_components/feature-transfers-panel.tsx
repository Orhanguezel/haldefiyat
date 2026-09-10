'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '../_lib/api';

type Bank = { bankName:string; accountHolder:string; iban:string };
type Transfer = { id:string; reference:string; listingId:number; title:string; days:number; amount:number; status:string; cancelled:boolean; senderName?:string; transferDate?:string; note?:string; reviewNote?:string; createdAt:string };
const emptyBank = {bankName:'',accountHolder:'',iban:''};
export function FeatureTransfersPanel() {
  const [items,setItems] = useState<Transfer[]>([]);
  const [bank,setBank] = useState<Bank>(emptyBank);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  async function load() {
    setBusy(true);setError('');
    try {
      const res = await api('/admin/listings/feature-transfers');
      if (!res.ok) throw new Error('Havale talepleri yüklenemedi.');
      setItems((await res.json()).items);
    } catch(e) {setError(e instanceof Error ? e.message : 'Bağlantı hatası.');} finally {setBusy(false);}
  }
  useEffect(() => { void load(); void (async () => {try {const r=await api('/admin/listings/feature-bank');if(r.ok)setBank((await r.json()).bank ?? emptyBank);} catch {setError('Banka bilgileri yüklenemedi.');}})(); },[]);
  async function saveBank() {
    setBusy(true);setError('');setMessage('');
    try {const r=await api('/admin/listings/feature-bank',{method:'PUT',body:JSON.stringify(bank)});if(!r.ok) throw new Error('Banka bilgileri kaydedilemedi. Ünvan ve geçerli TR IBAN kontrol edin.');setBank((await r.json()).bank);setMessage('Banka bilgileri kaydedildi. Yeni taleplerde kullanılacak.');}
    catch(e) {setError(e instanceof Error ? e.message : 'Bağlantı hatası.');} finally {setBusy(false);}
  }
  async function review(item:Transfer,action:'approve'|'reject',form:HTMLFormElement) {
    const fd=new FormData(form); const note=String(fd.get('reviewNote') ?? '').trim();
    if(note.length<3) {setError('En az 3 karakterlik kontrol / ret notu yazın.');return;}
    const verified=fd.get('verified')==='on';
    if(action==='approve'&&!verified) {setError('Banka hesabına gelen tutarı kontrol ettiğinizi onaylayın.');return;}
    setBusy(true);setError('');setMessage('');
    try {
      const r=await api(`/admin/listings/feature-transfers/${item.id}/review`,{method:'POST',body:JSON.stringify({action,reviewNote:note,paymentVerified:verified})});
      const body=await r.json();if(!r.ok) throw new Error(body.error?.message ?? 'Talep güncellenemedi.');
      setMessage(action==='approve'?'Ödeme onaylandı ve ilan öne çıkarıldı.':'Talep reddedildi. Bankadan para iadesi yapılmadı.');await load();
    } catch(e) {setError(e instanceof Error?e.message:'Bağlantı hatası.');} finally {setBusy(false);}
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">İlan öne çıkarma · Havale talepleri</h2><Button variant="outline" disabled={busy} onClick={() => void load()}>Yenile</Button></div>
    <p className="text-sm text-muted-foreground">Üyenin bildirimi ödeme kanıtı değildir. Banka hareketinden alıcı hesabını, açıklama kodunu ve tutarı doğrulayın. Onay, ücreti ödendi olarak işaretler ve öne çıkarma süresini başlatır.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm">{message}</p>}
    <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">Havale banka bilgileri</summary><form className="mt-4 grid gap-3" onSubmit={e=>{e.preventDefault();void saveBank();}}>
      <label className="space-y-1 text-sm">Banka<Input value={bank.bankName} required onChange={e=>setBank({...bank,bankName:e.target.value})}/></label>
      <label className="space-y-1 text-sm">Alıcı ünvanı<Input value={bank.accountHolder} required onChange={e=>setBank({...bank,accountHolder:e.target.value})}/></label>
      <label className="space-y-1 text-sm">IBAN<Input value={bank.iban} required onChange={e=>setBank({...bank,iban:e.target.value})}/></label>
      <Button type="submit" disabled={busy}>Banka bilgilerini kaydet</Button>
    </form></details>
    {!items.length && <p className="text-sm text-muted-foreground">{busy?'Yükleniyor…':'Henüz havale talebi yok.'}</p>}
    {items.map(item=><article key={item.id} className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">#{item.listingId} · {item.title}</h3><strong>{item.days} gün · {item.amount.toLocaleString('tr-TR',{minimumFractionDigits:2})} TL</strong></div>
      <p className="text-sm">{item.cancelled?'İptal / reddedildi':item.status==='paid'?'Onaylandı':item.status==='pending'?'Ödeme bildirildi · Kontrol bekliyor':'Üyenin havalesi bekleniyor'}</p>
      <p className="break-all font-mono text-xs">Açıklama: {item.reference}</p>
      {item.senderName && <p className="text-sm">Gönderen: {item.senderName} · Tarih: {item.transferDate || 'Belirtilmedi'}</p>}
      {item.note && <p className="text-sm">Üye notu: {item.note}</p>}
      {item.reviewNote && <p className="text-sm">Kontrol notu: {item.reviewNote}</p>}
      {!item.cancelled && item.status!=='paid' && <form className="space-y-3" onSubmit={e=>{e.preventDefault();void review(item,'approve',e.currentTarget);}}>
        <Input name="reviewNote" aria-label={`İlan ${item.listingId} kontrol notu`} placeholder="Kontrol / ret notu (üye de görür)" minLength={3} maxLength={500} required disabled={busy}/>
        {item.status==='pending' && <label className="flex min-h-11 items-center gap-2 text-sm"><input name="verified" type="checkbox" disabled={busy}/>Tutarın şirket hesabına geçtiğini ve açıklama kodunu kontrol ettim.</label>}
        <div className="flex flex-wrap gap-2">{item.status==='pending' && <Button type="submit" disabled={busy}>Ödemeyi onayla ve öne çıkar</Button>}<Button type="button" variant="outline" disabled={busy} onClick={e=>{const form=e.currentTarget.closest('form');if(form)void review(item,'reject',form);}}>Talebi reddet</Button></div>
      </form>}
    </article>)}
  </div>;
}
