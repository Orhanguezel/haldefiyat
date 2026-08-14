"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { apiGet } from "@/lib/api-client";
import { Bell, ChartNoAxesCombined, Inbox, ListChecks, PhoneCall, Scale, Star, Ticket, type LucideIcon } from "lucide-react";

type Summary = {
  alertCount: number;
  favoriteCount: number;
  unreadNotifications: number;
  openTickets: number;
  listingCount: number;
  openCallRequests: number;
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
      apiGet<{ items: unknown[] }>("/listings/me").then((r) => r.items.length).catch(() => 0),
      apiGet<{ items: { status: string }[] }>("/listings/call-requests/me")
        .then((r) => r.items.filter((item) => ["pending", "notified", "accepted"].includes(item.status)).length)
        .catch(() => 0),
    ]).then(([alertCount, favoriteCount, unreadNotifications, openTickets, listingCount, openCallRequests]) => {
      setSummary({ alertCount, favoriteCount, unreadNotifications, openTickets, listingCount, openCallRequests });
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("activeAlerts")}
          value={summary?.alertCount}
          href="hesabim/uyarilar"
          icon={Bell}
        />
        <StatCard
          label="İlanlarım"
          value={summary?.listingCount}
          href="hesabim/ilanlarim"
          icon={ListChecks}
        />
        <StatCard
          label="Açık arama talebi"
          value={summary?.openCallRequests}
          href="hesabim/arama-talepleri"
          icon={PhoneCall}
          highlight={Boolean(summary?.openCallRequests)}
        />
        <StatCard
          label={t("favoriteProducts")}
          value={summary?.favoriteCount}
          href="hesabim/favoriler"
          icon={Star}
        />
        <StatCard
          label={t("unreadNotifications")}
          value={summary?.unreadNotifications}
          href="hesabim/bildirimler"
          icon={Inbox}
          highlight={Boolean(summary?.unreadNotifications)}
        />
        <StatCard
          label={t("openTickets")}
          value={summary?.openTickets}
          href="hesabim/destek"
          icon={Ticket}
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
            icon={Bell}
          />
          <QuickAction
            href="fiyatlar"
            label={t("viewPrices")}
            desc={t("viewPricesDesc")}
            icon={ChartNoAxesCombined}
          />
          <QuickAction
            href="karsilastirma"
            label={t("compare")}
            desc={t("compareDesc")}
            icon={Scale}
          />
          <QuickAction
            href="hesabim/arama-talepleri"
            label="Arama taleplerini yönet"
            desc="Gelen ve gönderilen taleplerin durumunu görün"
            icon={PhoneCall}
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
  icon: LucideIcon;
  highlight?: boolean;
}) {
  const Icon = icon;
  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 rounded-xl border p-5 transition-colors hover:border-(--color-brand)/50 ${
        highlight
          ? "border-(--color-brand)/30 bg-(--color-brand)/5"
          : "border-(--color-border) bg-(--color-surface)"
      }`}
    >
      <Icon className="h-5 w-5 text-(--color-brand)" aria-hidden />
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
  icon: LucideIcon;
}) {
  const Icon = icon;
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-brand)/50 transition-colors"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-(--color-brand)" aria-hidden />
      <div>
        <p className="text-[13px] font-semibold text-(--color-foreground)">{label}</p>
        <p className="mt-0.5 text-[12px] text-(--color-muted)">{desc}</p>
      </div>
    </Link>
  );
}
