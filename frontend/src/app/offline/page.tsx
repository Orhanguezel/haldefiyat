import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Cevrimdisi | HaldeFiyat",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <WifiOff className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-normal">Baglanti yok</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Daha once ziyaret ettiginiz sayfalara erisebilirsiniz. Canli hal fiyatlari
          icin baglanti geri geldiginde veriler yenilenir.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Anasayfaya don
        </Link>
      </section>
    </main>
  );
}
