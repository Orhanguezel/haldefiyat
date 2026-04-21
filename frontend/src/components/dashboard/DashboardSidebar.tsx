"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

const NAV = [
  { href: "hesabim",             label: "Genel Bakış",   icon: GridIcon },
  { href: "hesabim/profil",      label: "Profil",        icon: UserIcon },
  { href: "hesabim/uyarilar",    label: "Uyarılarım",    icon: BellIcon },
  { href: "hesabim/favoriler",   label: "Favorilerim",   icon: StarIcon },
  { href: "hesabim/bildirimler", label: "Bildirimler",   icon: InboxIcon },
  { href: "hesabim/destek",      label: "Destek",        icon: HelpIcon },
  { href: "hesabim/guvenlik",    label: "Güvenlik",      icon: LockIcon },
];

interface Props {
  locale: string;
}

export function DashboardSidebar({ locale }: Props) {
  const pathname = usePathname();
  const { user, logout } = useAuthSession();

  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-(--color-border-soft) bg-(--color-surface) shadow-sm">
      {/* Profil özeti */}
      <div className="border-b border-(--color-border-soft) px-5 py-5 bg-(--color-border)/5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand font-display text-[16px] font-bold text-white shadow-lg shadow-brand/20">
          {user?.full_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <p className="mt-3 truncate text-[14px] font-bold text-(--color-foreground)">
          {user?.full_name ?? "Üye"}
        </p>
        <p className="truncate text-[12px] text-(--color-muted)">{user?.email}</p>
      </div>

      {/* Navigasyon */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const full = `/${locale}/${href}`;
          const active = pathname === full || pathname.startsWith(`${full}/`);
          return (
            <Link
              key={href}
              href={`/${locale}/${href}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
                active
                  ? "bg-brand text-white shadow-md shadow-brand/10"
                  : "text-(--color-muted) hover:bg-(--color-border)/50 hover:text-(--color-foreground)"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Alt kısım */}
      <div className="border-t border-(--color-border-soft) p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-(--color-danger) hover:bg-(--color-danger)/5 transition-colors"
        >
          <LogoutIcon size={17} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}

// ── İkonlar ──────────────────────────────────────────────────────────────────

function GridIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" />
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
function InboxIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M3 12l2-7h10l2 7" /><rect x="2" y="12" width="16" height="6" rx="1.5" />
      <path d="M7.5 15h5" strokeLinecap="round" />
    </svg>
  );
}
function HelpIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="10" cy="10" r="8" /><path d="M7.5 8a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" strokeLinecap="round" />
      <circle cx="10" cy="15" r=".5" fill="currentColor" />
    </svg>
  );
}
function LockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="4" y="9" width="12" height="9" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}
function ArrowLeftIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M13 10H4m0 0 4-4m-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LogoutIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M13 5l4 5-4 5M17 10H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" strokeLinecap="round" />
    </svg>
  );
}
