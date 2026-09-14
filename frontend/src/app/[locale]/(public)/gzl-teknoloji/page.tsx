import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Code2, Globe, Workflow } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import GzlQuoteForm from "@/components/ads/GzlQuoteForm";
import GzlTechnologyBanner from "@/components/ads/GzlTechnologyBanner";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("gzl-teknoloji", { locale, pathname: "/gzl-teknoloji", title: "GZL Teknoloji — Web, Özel Yazılım ve Otomasyon", description: "İşletmeniz için web sitesi, özel yazılım ve otomasyon çözümleri. GZL Teknoloji'ye projenizi anlatın, teklif talep edin." });
}
export default async function GzlTechnologyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageContainer py="sm">
    <div className="my-6 grid overflow-hidden rounded-3xl border border-(--color-border) bg-[#081e32] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative overflow-hidden p-7 text-white sm:p-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/sponsors/gzl-logo.png" alt="GZL Teknoloji" width={260} height={48} className="max-w-full" />
        <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">İşinize uygun yazılımı birlikte geliştirelim.</h1>
        <p className="mt-6 text-base leading-8 text-slate-200">Web sitenizden sipariş ve müşteri takibine kadar, işletmenizin ihtiyaçlarına uygun dijital çözümler geliştiriyoruz.</p>
        <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
          {[[Globe,"Web sitesi"],[Code2,"Özel yazılım"],[Workflow,"Otomasyon"]].map(([Icon, label]) => {
            const ServiceIcon = Icon as typeof Globe;
            return <div key={String(label)}><ServiceIcon className="mb-3 h-7 w-7 text-[#dfbd70]" /><span>{String(label)}</span></div>;
          })}
        </div>
        <a href="https://wa.me/905057151460?text=GZL%20Teknoloji%20yaz%C4%B1l%C4%B1m%20hizmetleri%20i%C3%A7in%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#dfbd70] px-5 py-3 font-bold text-[#081e32]">WhatsApp’tan yazın <ArrowRight size={18} /></a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/sponsors/gzl-devices.webp" alt="Yazılım ve otomasyon çözümlerini temsil eden bilgisayar ve telefon görseli" width={1000} height={667} className="mt-8 w-full rounded-2xl" />
        <Link href="https://gzlteknoloji.com/tr" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm text-slate-200 underline">GZL Teknoloji’yi inceleyin</Link>
      </div>
      <section id="teklif" className="scroll-mt-28 bg-(--color-surface) p-6 sm:p-8" aria-labelledby="gzl-page-quote-title">
        <h2 id="gzl-page-quote-title" className="text-2xl font-bold">Projenizi konuşalım</h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-(--color-muted)">İhtiyacınızı paylaşın; kapsamı ve sonraki adımları birlikte netleştirelim.</p>
        <GzlQuoteForm />
      </section>
    </div>
    <div className="mx-auto my-10 max-w-4xl"><GzlTechnologyBanner /></div>
  </PageContainer>;
}
