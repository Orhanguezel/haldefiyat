import Link from "next/link";

/**
 * "Bu urunu satiyor musunuz?" cagrisi.
 *
 * Ilan modulu 31 Agustos 2026'da tamamen sessizdi (0 aktif ilan). Iki sebebi
 * vardi: (1) form bos birakilan opsiyonel alanlarda 400 donuyordu — duzeltildi,
 * (2) ilan vermeyi ONEREN hicbir yuzey yoktu; /ilan-ver yalniz menude duruyordu
 * ve aramada noindex'ti. Urun sayfalari trafigin %40,5'ini aliyor ve fiyata
 * bakan kisi cogu zaman satici — davet edilmesi gereken yer burasi.
 */
export default function SellPrompt({
  productName,
  productSlug,
  className = "",
}: {
  productName: string;
  productSlug?: string;
  className?: string;
}) {
  const href = productSlug ? `/ilan-ver?product=${encodeURIComponent(productSlug)}` : "/ilan-ver";
  const name = productName.toLocaleLowerCase("tr-TR");

  return (
    <aside
      className={`rounded-[10px] border border-(--color-brand)/30 bg-(--color-brand)/6 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-(--color-foreground)">
          {productName} satıyor musunuz?
        </p>
        <p className="mt-1 text-[13px] leading-5 text-(--color-muted)">
          Ürününüzü her gün {name} fiyatlarına bakan alıcılara duyurun.
          Ücretsiz, komisyonsuz — satıştan pay alınmaz.
        </p>
      </div>
      <Link
        href={href}
        prefetch={false}
        className="mt-3 inline-flex min-h-11 shrink-0 items-center rounded-[6px] bg-(--color-brand) px-5 text-[13px] font-bold text-(--color-brand-fg) transition hover:opacity-90 sm:mt-0"
      >
        Ücretsiz ilan ver
      </Link>
    </aside>
  );
}
