"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "hesabim",             key: "overview",      icon: GridIcon },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-(--color-border-soft) bg-(--color-surface)/80 backdrop-blur-xl md:hidden">
      {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
        const full = `/${locale}/${href}`;
        const active = pathname === full || pathname.startsWith(`${full}/`);
        return (
          <Link
            key={href}
            href={full}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 ${
              active 
                ? "text-brand scale-110" 
                : "text-(--color-muted) hover:text-(--color-foreground)"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${active ? "bg-brand/10" : ""}`}>
              <Icon size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">{t(`nav.${key}`)}</span>
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
function BellIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M10 2.5a5.5 5.5 0 0 1 5.5 5.5v3l1.5 2H3l1.5-2V8A5.5 5.5 0 0 1 10 2.5z" />
      <path d="M8 16.5a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
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
