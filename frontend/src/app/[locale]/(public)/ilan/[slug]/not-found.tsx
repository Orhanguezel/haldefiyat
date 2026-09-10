import Link from "next/link";
export default function ListingNotFound() {
  return <div className="container mx-auto max-w-xl space-y-5 px-4 py-16">
    <p className="text-sm text-(--color-muted)">404</p><h1 className="text-2xl font-bold">Bu ilan şu anda yayında değil</h1>
    <p className="leading-7 text-(--color-muted)">İlanın süresi dolmuş, yayını kapatılmış veya bağlantısı değişmiş olabilir.</p>
    <p className="leading-7">İlan size aitse, hesabınızdan inceleyebilir, süresini uzatabilir veya silebilirsiniz.</p>
    <div className="flex flex-wrap gap-3"><Link href="/hesabim/ilanlarim" className="inline-flex min-h-11 items-center rounded-lg bg-(--color-brand) px-4 font-semibold text-(--color-brand-fg)">İlanlarıma git</Link><Link href="/ilanlar" className="inline-flex min-h-11 items-center rounded-lg border border-(--color-border) px-4">Yayındaki ilanlar</Link></div>
  </div>;
}
