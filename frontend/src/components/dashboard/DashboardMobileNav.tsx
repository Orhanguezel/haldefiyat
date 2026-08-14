"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "hesabim",             key: "overview",      icon: GridIcon },
  { href: "hesabim/ilanlarim",   key: "listings",      icon: ListIcon },
  { href: "hesabim/arama-talepleri", key: "callRequests", icon: PhoneIcon },
  { href: "hesabim/firmam",      key: "myFirm",        icon: BriefcaseIcon },
  { href: "hesabim/reklamlarim", key: "ads",           icon: MegaphoneIcon },
  { href: "hesabim/uyarilar",    key: "alerts",        icon: BellIcon },
  { href: "hesabim/favoriler",   key: "favorites",     icon: StarIcon },
  { href: "hesabim/profil",      key: "profile",       icon: UserIcon },
  { href: "hesabim/bildirimler", key: "notifications", icon: InboxIcon },
];

interface Props {
  locale: string;
}

export function DashboardMobileNav({ locale }: Props) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <nav aria-label="Hesap bölümleri" className="mb-6 flex gap-2 overflow-x-auto rounded-[10px] border border-(--color-border) bg-(--color-surface) p-2 lg:hidden">
      {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
        const full = `/${locale}/${href}`;
        const active = href === "hesabim" ? pathname === full : pathname === full || pathname.startsWith(`${full}/`);
        return (
          <Link
            key={href}
            href={full}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-[7px] px-3 text-xs font-semibold transition-colors ${
              active
                ? "bg-(--color-brand) text-(--color-brand-fg)"
                : "text-(--color-muted) hover:bg-(--color-bg-alt) hover:text-(--color-foreground)"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={17} />
            <span>{key === "ads" ? "Reklamlar" : t(`nav.${key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function GridIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ListIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="M6 5h11M6 10h11M6 15h11" strokeLinecap="round"/><circle cx="3" cy="5" r=".7" fill="currentColor"/><circle cx="3" cy="10" r=".7" fill="currentColor"/><circle cx="3" cy="15" r=".7" fill="currentColor"/></svg>;
}
function PhoneIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="M5 3h3l1 4-2 1.5a12 12 0 0 0 4.5 4.5L13 11l4 1v3c0 1.1-.9 2-2 2A12 12 0 0 1 3 5c0-1.1.9-2 2-2Z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function BellIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M10 2.5a5.5 5.5 0 0 1 5.5 5.5v3l1.5 2H3l1.5-2V8A5.5 5.5 0 0 1 10 2.5z" />
      <path d="M8 16.5a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}
function BriefcaseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3" y="7" width="14" height="10" rx="2" /><path d="M7 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 11h14" />
    </svg>
  );
}
function MegaphoneIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="M3 9v3a2 2 0 0 0 2 2h2l2.5 3H12l-2-4 7-3V5L7 9H5a2 2 0 0 0-2 2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
      <path d="M10 2.5l2.4 5 5.5.8-4 3.9.95 5.5L10 15l-4.85 2.7.95-5.5-4-3.9 5.5-.8z" />
    </svg>
  );
}
function UserIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="10" cy="7" r="3.5" /><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
    </svg>
  );
}
function InboxIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M3 12l2-7h10l2 7" /><rect x="2" y="12" width="16" height="6" rx="1.5" />
      <path d="M7.5 15h5" strokeLinecap="round" />
    </svg>
  );
}
