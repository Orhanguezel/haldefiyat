"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { useUserAlerts, type UserAlert } from "@/lib/hooks/useUserAlerts";
import { AlertEditModal } from "./AlertEditModal";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props { locale: string }

export function AlertsList({ locale }: Props) {
  const t = useTranslations("dashboard.alerts");
  const commonT = useTranslations("dashboard.overview");
  const { items, loading, error, remove } = useUserAlerts();
  const [editing, setEditing] = useState<UserAlert | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-[13px] text-(--color-danger)">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <p className="text-[13px] text-(--color-muted)">{t("empty")}</p>
        <Link
          href={`/${locale}/uyarilar`}
          className="mt-3 inline-block rounded-lg bg-(--color-brand) px-4 py-2 text-[13px] font-semibold text-(--color-navy)"
        >
          {commonT("addAlert")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-(--color-foreground)">
                {alert.productName}
              </p>
              <p className="mt-0.5 text-[12px] text-(--color-muted)">
                {alert.direction === "above" ? t("above") : t("below")}{" "}
                <span className="font-medium text-(--color-brand)">
                  {parseFloat(alert.thresholdPrice).toLocaleString("tr-TR")} ₺
                </span>
                {alert.marketName && ` · ${alert.marketName}`}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {alert.contactEmail && <ChannelBadge label="E-posta" />}
                {alert.contactTelegram && <ChannelBadge label="Telegram" />}
                {alert.lastTriggered && (
                  <span className="text-[11px] text-(--color-muted)">
                    {t("lastTriggered")}: {new Date(alert.lastTriggered).toLocaleDateString("tr-TR")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setEditing(alert)}
                className="rounded-lg border border-(--color-border) px-3 py-1.5 text-[12px] font-medium text-(--color-foreground) hover:bg-(--color-border)/50 transition-colors"
              >
                {t("edit")}
              </button>
              <button
                onClick={() => remove(alert.id)}
                className="rounded-lg border border-(--color-danger)/30 px-3 py-1.5 text-[12px] font-medium text-(--color-danger) hover:bg-(--color-danger)/10 transition-colors"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <AlertEditModal
          alert={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ChannelBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-(--color-brand)/10 px-2 py-0.5 text-[11px] font-medium text-(--color-brand)">
      {label}
    </span>
  );
}
