"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props { locale: string }

export function FavoritesList({ locale }: Props) {
  const t = useTranslations("dashboard.favorites");
  const commonT = useTranslations("dashboard.overview");
  const { remoteItems, loadingRemote, toggle, refetch } = useFavorites();

  useEffect(() => { void refetch(); }, [refetch]);

  if (loadingRemote) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (remoteItems.length === 0) {
    return (
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <p className="text-[13px] text-(--color-muted)">{t("empty")}</p>
        <Link
          href={`/${locale}/fiyatlar`}
          className="mt-3 inline-block rounded-lg bg-(--color-brand) px-4 py-2 text-[13px] font-semibold text-(--color-navy)"
        >
          {commonT("viewPrices")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {remoteItems.map((product) => (
        <div
          key={product.slug}
          className="flex items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4"
        >
          <div className="min-w-0">
            <Link
              href={`/${locale}/urun/${product.slug}`}
              className="truncate text-[13px] font-semibold text-(--color-foreground) hover:text-(--color-brand) transition-colors"
            >
              {product.nameTr}
            </Link>
            <p className="mt-0.5 text-[11px] text-(--color-muted) capitalize">
              {product.categorySlug} · {product.unit}
            </p>
          </div>
          <button
            onClick={() => toggle(product.slug)}
            className="shrink-0 rounded-lg border border-(--color-danger)/30 px-3 py-1.5 text-[12px] font-medium text-(--color-danger) hover:bg-(--color-danger)/10 transition-colors"
          >
            {t("remove")}
          </button>
        </div>
      ))}
    </div>
  );
}
