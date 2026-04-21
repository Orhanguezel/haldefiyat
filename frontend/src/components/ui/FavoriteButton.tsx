"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isFavorite,
  toggleFavorite,
  subscribeFavorites,
} from "@/lib/favorites";
import { apiPost, apiDelete } from "@/lib/api-client";
import { getStoredAccessToken } from "@/lib/auth-token";

interface FavoriteButtonProps {
  slug: string;
  productName?: string;
  variant?: "full" | "icon";
  className?: string;
}

/**
 * Favori yildiz butonu.
 *
 * NEDEN client + useEffect: SSR sirasinda localStorage yok, bu yuzden ilk
 * render hep pasif. Mount sonrasi gercek state cekilir, subscribeFavorites
 * ile diger bilesenlerden gelen degisimler de dinlenir.
 */
export default function FavoriteButton({
  slug,
  productName,
  variant = "full",
  className = "",
}: FavoriteButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActive(isFavorite(slug));
    const unsub = subscribeFavorites((slugs) => {
      setActive(slugs.includes(slug));
    });
    return unsub;
  }, [slug]);

  const onClick = useCallback(async () => {
    const loggedIn = Boolean(getStoredAccessToken());
    if (loggedIn) {
      const currently = active;
      setActive(!currently);
      try {
        if (currently) {
          await apiDelete(`/favorites/${slug}`);
        } else {
          await apiPost("/favorites", { productSlug: slug });
        }
      } catch {
        setActive(currently); // geri al
      }
    } else {
      const next = toggleFavorite(slug);
      setActive(next);
    }
  }, [slug, active]);

  const label = active ? "Favorilerden çıkar" : "Favorilere ekle";
  const aria = productName ? `${productName}: ${label}` : label;

  const padding = variant === "icon" ? "h-8 w-8 justify-center p-0" : "px-3 py-2";
  const base = `inline-flex items-center gap-2 rounded-[10px] border font-(family-name:--font-mono) text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors ${padding}`;
  const state = active
    ? "border-(--color-brand) bg-(--color-brand)/10 text-(--color-brand)"
    : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-brand)/50 hover:text-(--color-brand)";

  const onButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    void onClick();
  };

  return (
    <button
      type="button"
      onClick={onButtonClick}
      aria-pressed={mounted ? active : undefined}
      aria-label={aria}
      title={label}
      className={`${base} ${state} ${className}`}
    >
      <Star filled={active} />
      {variant === "full" ? <span className="hidden sm:inline">Favori</span> : null}
    </button>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 2.5l2.4 5 5.5.8-4 3.9.95 5.5L10 15l-4.85 2.7.95-5.5-4-3.9 5.5-.8z" />
    </svg>
  );
}
