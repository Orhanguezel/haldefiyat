"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { apiGet } from "@/lib/api-client";

type Summary = {
  alertCount: number;
  favoriteCount: number;
  unreadNotifications: number;
  openTickets: number;
};

export function DashboardOverview() {
  const t = useTranslations("dashboard.overview");
  const { user } = useAuthSession();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<{ items: unknown[] }>("/user/alerts").then((r) => r.items.length).catch(() => 0),
      apiGet<{ items: unknown[] }>("/favorites").then((r) => r.items.length).catch(() => 0),
      apiGet<{ count: number }>("/notifications/unread-count").then((r) => r.count).catch(() => 0),
      apiGet<{ items: { status: string }[] }>("/support/tickets/my")
        .then((r) => r.items.filter((t) => t.status === "open").length)
        .catch(() => 0),
    ]).then(([alertCount, favoriteCount, unreadNotifications, openTickets]) => {
      setSummary({ alertCount, favoriteCount, unreadNotifications, openTickets });
    });
  }, []);

  const greeting = user?.full_name
    ? t("greetingWithUser", { name: user.full_name.split(" ")[0] })
    : t("greeting");

  return (
    <div className="space-y-8">
      {/* Selamlama */}
      <div>
        <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
          {greeting}
        </h1>
        <p className="mt-1 text-[13px] text-(--color-muted)">
          {t("subtitle")}
        </p>
      </div>

      {/* Özet kartlar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("activeAlerts")}
          value={summary?.alertCount}
          href="hesabim/uyarilar"
          icon="🔔"
        />
        <StatCard
          label={t("favoriteProducts")}
          value={summary?.favoriteCount}
          href="hesabim/favoriler"
          icon="⭐"
        />
        <StatCard
          label={t("unreadNotifications")}
          value={summary?.unreadNotifications}
          href="hesabim/bildirimler"
          icon="📥"
          highlight={Boolean(summary?.unreadNotifications)}
        />
        <StatCard
          label={t("openTickets")}
          value={summary?.openTickets}
          href="hesabim/destek"
          icon="🎫"
        />
      </div>

      {/* Hızlı eylemler */}
      <div>
        <h2 className="mb-4 font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
          {t("quickActions")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            href="uyarilar"
            label={t("addAlert")}
            desc={t("addAlertDesc")}
            icon="🔔"
          />
          <QuickAction
            href="fiyatlar"
            label={t("viewPrices")}
            desc={t("viewPricesDesc")}
            icon="📊"
          />
          <QuickAction
            href="karsilastirma"
            label={t("compare")}
            desc={t("compareDesc")}
            icon="⚖️"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  icon,
  highlight,
}: {
  label: string;
  value: number | undefined;
  href: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 rounded-xl border p-5 transition-colors hover:border-(--color-brand)/50 ${
        highlight
          ? "border-(--color-brand)/30 bg-(--color-brand)/5"
          : "border-(--color-border) bg-(--color-surface)"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
        {value === undefined ? (
          <span className="inline-block h-7 w-8 animate-pulse rounded bg-(--color-border)" />
        ) : value}
      </span>
      <span className="text-[12px] text-(--color-muted)">{label}</span>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  desc,
  icon,
}: {
  href: string;
  label: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-brand)/50 transition-colors"
    >
      <span className="mt-0.5 text-xl">{icon}</span>
      <div>
        <p className="text-[13px] font-semibold text-(--color-foreground)">{label}</p>
        <p className="mt-0.5 text-[12px] text-(--color-muted)">{desc}</p>
      </div>
    </Link>
  );
}
