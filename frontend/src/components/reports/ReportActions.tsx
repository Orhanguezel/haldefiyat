"use client";

import Link from "next/link";
import { Download, ExternalLink, MessageSquareWarning, Share2 } from "lucide-react";
import { useState } from "react";

export default function ReportActions({
  title,
  pathname,
}: {
  title: string;
  pathname: string;
}) {
  const [status, setStatus] = useState("");
  const itemClass = "inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-(--color-border) bg-(--color-surface) px-3 text-sm font-semibold text-(--color-foreground) transition-colors hover:border-(--color-brand)/45 hover:text-(--color-brand)";

  const share = async () => {
    const url = new URL(pathname, window.location.origin).toString();
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        setStatus("Rapor paylaşıldı");
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("Rapor bağlantısı kopyalandı");
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") setStatus("Rapor bağlantısı kopyalanamadı");
    }
  };

  return (
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Rapor eylemleri">
      <button type="button" className={itemClass} onClick={() => window.print()}>
        <Download className="h-4 w-4" aria-hidden="true" />
        PDF / Yazdır
      </button>
      <button type="button" className={itemClass} onClick={() => void share()}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Paylaş
      </button>
      <Link href="/metodoloji" className={itemClass}>
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Kaynak ve yöntem
      </Link>
      <a
        href={`mailto:iletisim@haldefiyat.com?subject=${encodeURIComponent(`Düzeltme bildirimi: ${title}`)}`}
        className={itemClass}
      >
        <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
        Düzeltme / geri bildirim
      </a>
      <span className="sr-only" aria-live="polite">{status}</span>
    </div>
  );
}
