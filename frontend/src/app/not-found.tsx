import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-border-soft bg-surface p-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand mb-4">404</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Aradığınız sayfa bulunamadı
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted mb-8">
            İlgili bağlantı taşınmış, kaldırılmış veya yanlış yazılmış olabilir. site ana
            sayfasına dönerek yeni bir rota başlatabilirsiniz.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
