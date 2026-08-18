"use client";

import { Bookmark, Flag, Share2 } from "lucide-react";
import { useState } from "react";

const BUTTON = "inline-flex min-h-10 items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-xs font-semibold text-(--color-foreground) transition hover:border-(--color-brand)/40 hover:text-(--color-brand)";

export function ListingSecondaryActions({ listingId, title, pathname }: {
  listingId: number;
  title: string;
  pathname: string;
}) {
  const [status, setStatus] = useState("");

  const share = async () => {
    const url = `${window.location.origin}${pathname}`;
    if (typeof navigator.share === "function") await navigator.share({ title, url });
    else await navigator.clipboard.writeText(url);
    setStatus("İlan bağlantısı paylaşıma hazırlandı.");
  };

  const save = () => {
    const key = "haldefiyat:saved-listings";
    const saved = new Set<string>(JSON.parse(window.localStorage.getItem(key) ?? "[]"));
    saved.add(String(listingId));
    window.localStorage.setItem(key, JSON.stringify([...saved]));
    setStatus("İlan bu tarayıcıya kaydedildi.");
  };

  return (
    <section className="mt-5 border-t border-(--color-border-soft) pt-4" aria-label="İkincil ilan eylemleri">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} className={BUTTON}><Bookmark className="size-4" aria-hidden="true" />Kaydet</button>
        <button type="button" onClick={() => void share()} className={BUTTON}><Share2 className="size-4" aria-hidden="true" />Paylaş</button>
        <a href={`mailto:info@gzlteknoloji.com?subject=${encodeURIComponent(`İlan bildirimi: ${title}`)}&body=${encodeURIComponent(`${pathname}\n\nBildirim nedeni:`)}`} className={BUTTON}>
          <Flag className="size-4" aria-hidden="true" />Raporla
        </a>
      </div>
      <p className="sr-only" aria-live="polite">{status}</p>
    </section>
  );
}
