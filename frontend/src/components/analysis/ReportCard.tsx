import Image from 'next/image';
import Link from 'next/link';
import type { AnalizMakale } from '@/lib/analiz';

export default function ReportCard({ report, heading = 'h3' }: { report: AnalizMakale; heading?: 'h2' | 'h3' }) {
  const Heading = heading;
  const cover = report.ogImage?.trim();
  const src = cover && !cover.includes('og-default') ? cover : `/og/analiz/${report.slug}`;
  const date = new Date(report.tarih);
  return <Link href={`/analiz/${report.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
    <div className="relative aspect-[1200/630] overflow-hidden bg-white">
      <Image src={src} alt={report.imageAlt || report.baslik} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" className="object-contain" />
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted"><time dateTime={report.tarih}>{Number.isNaN(date.getTime()) ? report.tarih : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>{report.etiketler[0] && <span className="rounded-full bg-brand/10 px-2 py-1 font-semibold text-brand">{report.etiketler[0]}</span>}</div>
      <Heading className="text-lg font-bold leading-snug text-foreground group-hover:text-brand">{report.baslik}</Heading>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{report.ozet}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs"><span className="text-muted">{report.yazar}</span><span className="shrink-0 font-semibold text-brand">Raporu oku →</span></div>
    </div>
  </Link>;
}
