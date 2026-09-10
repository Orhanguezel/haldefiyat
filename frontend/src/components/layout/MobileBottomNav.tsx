"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/locale-path";

import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { PlusCircle, UserRound, Store } from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size: number }> };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Anasayfa", icon: HomeIcon },
  { href: "/fiyatlar", label: "Fiyatlar", icon: PriceIcon },
  { href: "/ilan-ver", label: "İlan ver", icon: PlusCircle },
  { href: "/ilanlar", label: "İlanlar", icon: Store },
];

interface Props {
  locale: string;
}

/**
 * Mobil alt navigasyon (fiyat, ilan ve hesap erişimi). lg altında görünür, desktop'ta gizli.
 * Safe-area inset ile iPhone home indicator çakışmasını önler. DashboardMobileNav deseni aynalandı.
 */
export function MobileBottomNav({ locale }: Props) {
  const pathname = usePathname() ?? "/";
  const { user } = useAuthSession();
  const items = [...NAV_ITEMS, { href: user ? "/hesabim" : "/giris", label: user ? "Hesabım" : "Giriş", icon: UserRound }];

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/" || /^\/[a-z]{2}\/?$/.test(pathname);
    return pathname.includes(href);
  };

  return (
    <nav
      aria-label="Mobil navigasyon"
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-(--color-border-soft) bg-(--color-surface)/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={localePath(locale, href)}
            aria-current={active ? "page" : undefined}
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              active ? "text-(--color-brand)" : "text-(--color-muted) hover:text-(--color-foreground)"
            }`}
          >
            <span className={`grid place-items-center rounded-xl p-1.5 transition-colors ${active ? "bg-(--color-brand)/10" : ""}`}>
              <Icon size={22} />
            </span>
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5 10 3l7 6.5" strokeLinecap="round" />
      <path d="M5 8.5V17h10V8.5" />
      <path d="M8.5 17v-4h3v4" />
    </svg>
  );
}
function PriceIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
      <path d="M10.5 2.5H4.5a2 2 0 0 0-2 2v6l7.5 7.5a1.5 1.5 0 0 0 2.1 0l4.9-4.9a1.5 1.5 0 0 0 0-2.1L9.5 3.1" />
      <circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
