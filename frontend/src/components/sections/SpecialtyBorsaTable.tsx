import Link from 'next/link';
import data from '@/data/itb-specialty.json';
import { formatDateTr } from '@/lib/date-format';

/** Tescil kesiti: kaynak sınıfı ve satış şekli korunur; ulusal fiyat türetilmez. */
export default function SpecialtyBorsaTable({ product }: { product: 'kuru-uzum' | 'kekik' }) {
 const rows=data.rows.filter(r=>r.product===product).sort((a,b)=>b.date.localeCompare(a.date));
 const name=product==='kuru-uzum'?'Kuru üzüm':'Kekik';
 const fmt=(v:number)=>v.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
 return <section id="borsa-kayitlari" className="my-8 space-y-4" aria-label={`${name} borsa kayıtları`}>
  <h2 className="text-2xl font-bold">{name}: kilogram üzerinden borsa tescil kayıtları</h2>
  <p className="text-sm leading-7 text-muted">İzmir Ticaret Borsası, {formatDateTr(data.documents[0].date)}–{formatDateTr(data.documents.at(-1)!.date)} bülten kesiti. Son {name.toLocaleLowerCase('tr-TR')} kaydı: {formatDateTr(rows[0].date)}. Bu tarihli arşiv 8 Eylül 2026’da kontrol edildi; bugünün fiyatı veya kesintisiz günlük seri değildir.</p>
  <p className="text-sm leading-7 text-muted">Her satırın ürün sınıfı ve satış şekli kaynakta yazıldığı biçimde korunur. Ortalama borsanın yayımladığı değerdir. Farklı sınıflar ve satış şekilleri tek fiyatta birleştirilmez; tescil tarihi hasat tarihi değildir. Perakende, bahçe alımı ve hal fiyatıyla eş tutulmaz. Kodların açıklaması kaynak bültenin son sayfasındadır.</p>
  <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[780px] text-sm">
   <thead><tr className="bg-surface text-left">{['Tarih','Kaynak ürün sınıfı','Satış şekli','En az TL/kg','En çok TL/kg','Ortalama TL/kg','Miktar kg','Kaynak'].map(x=><th key={x} scope="col" className="p-3">{x}</th>)}</tr></thead>
   <tbody>{rows.map((r,i)=><tr key={`${r.date}-${r.label}-${r.sale}-${i}`} className="border-t border-border"><td className="p-3 whitespace-nowrap">{formatDateTr(r.date)}</td><th scope="row" className="p-3 text-left font-medium">{r.label}</th><td className="p-3">{r.sale}</td><td className="p-3">{fmt(r.min)}</td><td className="p-3">{fmt(r.max)}</td><td className="p-3">{fmt(r.average)}</td><td className="p-3">{fmt(r.quantity)}</td><td className="p-3"><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">İTB PDF</a></td></tr>)}</tbody>
  </table></div>
  <a href="/data/itb-kuru-uzum-kekik-2026-09-08.csv" className="inline-block text-sm font-semibold underline">Kaynak bağlantılı kayıtları CSV olarak indir</a>
  <p className="text-sm text-muted">Sıfır fiyat/miktar içeren fiyat farkı satırları fiyat serisine alınmadı. İşlem olmayan günler sıfır fiyat veya fiyat değişmedi şeklinde tamamlanmadı.</p>
  {product==='kuru-uzum' && <p><Link className="underline" href="/urun/uzum">Yaş ve sofralık üzümün hal fiyatlarını ayrı inceleyin.</Link></p>}
 </section>;
}
