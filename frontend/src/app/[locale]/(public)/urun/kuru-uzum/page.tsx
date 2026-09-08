import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import PageContainer from '@/components/layout/PageContainer';
import Breadcrumb from '@/components/seo/Breadcrumb';
import JsonLd from '@/components/seo/JsonLd';
import SpecialtyBorsaTable from '@/components/sections/SpecialtyBorsaTable';
import { getPageMetadata, DATA_LICENSE_URL, ORG_REF } from '@/lib/seo';
import data from '@/data/itb-specialty.json';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;
 return getPageMetadata('kuru_uzum',{locale,pathname:'/urun/kuru-uzum',title:'Kuru Üzüm Fiyatları 2026 — Sınıf Bazında İTB Kayıtları',description:'Çekirdeksiz kuru üzümün İzmir Ticaret Borsası tescil fiyatları. Tarih, ürün sınıfı, satış şekli, TL/kg aralığı ve kaynak PDF; yaş üzümden ayrı.'});
}
export default async function Page({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;setRequestLocale(locale);
 return <PageContainer py="sm">
  <Breadcrumb visible items={[{name:'Anasayfa',href:'/'},{name:'Kuru üzüm fiyatları',href:'/urun/kuru-uzum'}]}/>
  <h1 className="mt-6 text-4xl font-bold">Kuru Üzüm Fiyatları 2026</h1>
  <p className="mt-4 leading-8">Kuru üzüm fiyatını değerlendirirken naturel, işlenmiş, ambalajlı, organik ve standart tip kayıtlarını ayırın. Aşağıdaki rakamlar İzmir Ticaret Borsası’nın tarihli tescil bültenlerinden alınmıştır; tüm Türkiye’nin veya üreticinin tek alım fiyatı değildir.</p>
  <SpecialtyBorsaTable product="kuru-uzum"/>
  <section className="my-8 space-y-4"><h2 className="text-2xl font-bold">Kuru üzüm ile yaş üzüm aynı fiyat serisi mi?</h2><p>Hayır. Kurutulmuş ürünün işleme, ambalaj ve standart tipi farklıdır. Yaş üzüm hal fiyatını kuru üzüm kilogram fiyatı olarak kullanmayın. Bu sayfada farklı ürün sınıfları arasında yüzde değişim veya tek ortalama hesaplanmaz.</p>
  <h2 className="text-2xl font-bold">Referans fiyatı ile tescil fiyatı nasıl ayrılır?</h2><p>Bu tablo günlük tescil kayıtlarını gösterir. Salon referans bültenindeki alıcı/satıcı teklifleri gerçekleşmiş işlemle aynı değildir. 7 Eylül 2026 referans bülteninde kuru üzüm piyasası “muamelesiz” belirtilmiştir; bu, fiyatın sıfır olduğu anlamına gelmez.</p><a className="underline" href="https://itb.org.tr/dosya/bulten/20260907-referans-bulteni-3.pdf">7 Eylül referans bülteni</a>
  <p><Link href="/metodoloji" className="underline">Fiyat verilerinin yöntemini inceleyin.</Link></p></section>
  <JsonLd type="Dataset" data={{name:'İTB kuru üzüm tescil kayıtları — Ağustos–Eylül 2026 kesiti',description:'Ürün sınıfı, satış şekli ve tarih ayrımı korunan kuru üzüm fiyat kayıtları.',creator:ORG_REF,license:DATA_LICENSE_URL,dateModified:data.checkedAt,temporalCoverage:`${data.documents[0].date}/${data.documents.at(-1)!.date}`,distribution:{'@type':'DataDownload',encodingFormat:'text/csv',contentUrl:'https://haldefiyat.com/data/itb-kuru-uzum-kekik-2026-09-08.csv'}}}/>
 </PageContainer>;
}
