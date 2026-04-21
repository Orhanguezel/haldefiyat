"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import SearchModalTrigger from "@/components/ui/SearchModalTrigger";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { getLocaleFromPathname } from "@/i18n/routing";
import { localePath } from "@/lib/locale-path";
import { ThemeToggle } from "./ThemeToggle";

export interface NavLink {
  key: string;
  label: string;
  href: string;
}

interface HeaderNavClientProps {
  links: ReadonlyArray<NavLink>;
}

/**
 * Active state ve mobile drawer state icin client island.
 * Search input + buttons da burada tutulur (kucuk JS yuku).
 */
export default function HeaderNavClient({ links }: HeaderNavClientProps) {
  const pathname = usePathname() ?? "/";
  const locale = getLocaleFromPathname(pathname);
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { user, loading, logout } = useAuthSession();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/" || /^\/[a-z]{2}\/?$/.test(pathname);
    return pathname.includes(href);
  };

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center gap-1">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.key}
              href={link.href}
              className={clsx(
                "px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                active
                  ? "text-(--color-brand) bg-(--color-brand-light)"
                  : "text-(--color-muted) hover:text-(--color-foreground) hover:bg-(--color-bg-alt)",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Search bar */}
      <div className="hidden lg:flex items-center w-full max-w-[240px] min-w-[140px] h-10 px-3 rounded-xl bg-(--color-bg-alt) border border-(--color-border-soft) hover:border-(--color-brand)/30 hover:bg-(--color-background) transition-all group">
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-(--color-muted) group-hover:text-(--color-brand) transition-colors shrink-0"
          aria-hidden
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m17 17-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          readOnly
          placeholder="Ara..."
          aria-label="Ürün veya şehir ara"
          onClick={() => document.dispatchEvent(new Event("open-search"))}
          onKeyDown={(e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.dispatchEvent(new Event("open-search"));
            }
          }}
          className="flex-1 mx-2 cursor-pointer bg-transparent text-[13px] text-(--color-foreground) placeholder:text-(--color-muted) focus:outline-none"
        />
        <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded border border-(--color-border) bg-(--color-background) text-[10px] font-mono text-(--color-muted)">
          ⌘K
        </kbd>
      </div>
      {/* CTA buttons */}
      <div className="hidden lg:flex items-center gap-4 shrink-0 px-2">
        <ThemeToggle />
        {user ? (
          <>
            <span className="inline-flex h-10 items-center rounded-xl border border-(--color-border) px-4 text-[13px] font-medium text-(--color-foreground) bg-(--color-bg-alt)/50">
              {user.full_name?.split(" ")[0] ?? user.email ?? "Hesabım"}
            </span>
            <button
              type="button"
              disabled={logoutLoading}
              onClick={async () => {
                setLogoutLoading(true);
                try {
                  await logout();
                } finally {
                  setLogoutLoading(false);
                }
              }}
              className="h-10 px-4 inline-flex items-center justify-center rounded-xl border border-(--color-border) text-[13px] font-medium text-(--color-foreground) hover:bg-(--color-bg-alt) hover:border-(--color-border) transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
            >
              Çıkış Yap
            </button>
          </>
        ) : (
          <>
            <Link
              href={localePath(locale, "/giris")}
              className="h-10 px-5 inline-flex items-center justify-center rounded-xl border border-(--color-border) text-[13px] font-semibold text-(--color-foreground) hover:bg-(--color-bg-alt) hover:text-(--color-brand) transition-all active:scale-95 whitespace-nowrap"
            >
              {loading ? "Yükleniyor..." : "Giriş Yap"}
            </Link>
            <Link
              href={localePath(locale, "/kayit")}
              className="h-10 px-5 inline-flex items-center justify-center rounded-xl bg-(--color-brand) text-(--color-brand-fg) text-[13px] font-bold hover:bg-(--color-brand-dark) hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-(--color-brand)/20 whitespace-nowrap"
            >
              Ücretsiz Başla
            </Link>
          </>
        )}
      </div>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menüyü aç/kapat"
        aria-expanded={open}
        className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-(--color-foreground) hover:bg-(--color-bg-alt)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden absolute left-0 right-0 top-full border-t border-(--color-border) bg-(--color-surface)/95 backdrop-blur-lg">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={clsx(
                  "px-3 py-3 rounded-md text-sm font-medium",
                  isActive(link.href)
                    ? "text-(--color-brand) bg-(--color-brand-light)"
                    : "text-(--color-foreground) hover:bg-(--color-bg-alt)",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-(--color-border) pt-3">
              <ThemeToggle />
              {user ? (
                <button
                  type="button"
                  disabled={logoutLoading}
                  onClick={async () => {
                    setLogoutLoading(true);
                    try {
                      await logout();
                    } finally {
                      setLogoutLoading(false);
                    }
                  }}
                  className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-(--color-border) text-sm font-medium disabled:opacity-60"
                >
                  Çıkış Yap
                </button>
              ) : (
                <>
                  <Link
                    href={localePath(locale, "/giris")}
                    className="flex-1 h-11 inline-flex items-center justify-center rounded-xl border border-(--color-border) text-sm font-semibold hover:bg-(--color-bg-alt) transition-all active:scale-95"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href={localePath(locale, "/kayit")}
                    className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-(--color-brand) text-(--color-brand-fg) text-sm font-bold shadow-md shadow-(--color-brand)/10 active:scale-95 transition-all"
                  >
                    Ücretsiz Başla
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      <SearchModalTrigger />
    </>
  );
}
