"use client";

import { Search } from "lucide-react";
import { openSearchModal } from "@/components/ui/SearchModal";

export default function HeroSearchButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={openSearchModal}
      aria-haspopup="dialog"
      className={compact
        ? "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-4 text-[13px] font-black text-(--color-brand-fg)"
        : "inline-flex min-h-12 w-full items-center justify-start gap-3 rounded-xl border border-(--color-border) bg-(--color-background) px-5 text-left font-semibold text-(--color-muted) transition-colors hover:border-(--color-brand) hover:text-(--color-foreground) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"}
    >
      <Search aria-hidden className="h-5 w-5 shrink-0" />
      Ürün veya hal ara
    </button>
  );
}
