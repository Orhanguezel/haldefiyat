"use client";

import Link from "next/link";
import { Bell, Scale, Share2 } from "lucide-react";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { openAlertModal } from "@/components/ui/alert/types";
import { useState } from "react";

export default function ProductActions({
  slug,
  productName,
}: {
  slug: string;
  productName: string;
}) {
  const [shareStatus, setShareStatus] = useState("");

  const share = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `${productName} hal fiyatı`, url });
        setShareStatus("Paylaşıldı");
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Bağlantı kopyalandı");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") setShareStatus("Bağlantı kopyalanamadı");
    }
  };

  const itemClass = "inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-(--color-border) bg-(--color-surface) px-3 py-2 font-(family-name:--font-mono) text-[12px] font-semibold uppercase tracking-[0.06em] text-(--color-muted) transition-colors hover:border-(--color-brand)/50 hover:text-(--color-brand)";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2" aria-label="Ürün eylemleri">
      <FavoriteButton slug={slug} productName={productName} />
      <button type="button" onClick={() => openAlertModal(slug)} className={itemClass}>
        <Bell className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Alarm kur</span>
      </button>
      <Link href={`/karsilastirma?products=${encodeURIComponent(slug)}`} className={itemClass}>
        <Scale className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Karşılaştır</span>
      </Link>
      <button type="button" onClick={() => void share()} className={itemClass}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Paylaş</span>
      </button>
      <span className="sr-only" aria-live="polite">{shareStatus}</span>
    </div>
  );
}
