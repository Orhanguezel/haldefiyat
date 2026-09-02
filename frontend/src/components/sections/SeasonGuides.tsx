import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ProductImage from "@/components/ui/ProductImage";
import { REHBER_LIST } from "@/lib/rehber";

/**
 * Ana sayfa "Sezon Rehberleri" bolumu. Config'den beslenir (lib/rehber.ts);
 * yeni rehber eklenince burada kendiliginden gorunur.
 */
export default function SeasonGuides() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10" aria-label="Sezon rehberleri">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">Sezon rehberleri</h2>
          <p className="mt-1 text-sm text-(--color-muted)">Neyi ne zaman almalı? En ucuz ay, 12 aylık hal kayıtlarından.</p>
        </div>
        <Link href="/rehber" className="text-sm font-semibold text-(--color-brand)">Tümü</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {REHBER_LIST.map((guide) => (
          <Link
            key={guide.slug}
            href={`/rehber/${guide.slug}`}
            className="group overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) transition hover:border-(--color-brand)/50 hover:shadow-md"
          >
            <div className="flex items-center gap-4 p-5 pb-3">
              <ProductImage
                slug={guide.coverImageSlug}
                name={guide.h1}
                size={68}
                className="rounded-xl transition duration-300 group-hover:scale-105"
              />
              <div>
                <h3 className="font-(family-name:--font-display) font-bold text-(--color-foreground) group-hover:text-(--color-brand)">{guide.h1}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">{guide.seasonWindow}</p>
              </div>
            </div>
            <p className="px-5 text-sm leading-6 text-(--color-muted)">{guide.tagline}</p>
            <span className="mx-5 mb-5 mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-brand)">
              Rehberi aç <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
