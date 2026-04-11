"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import SearchModalTrigger from "@/components/ui/SearchModalTrigger";

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
  const [open, setOpen] = useState(false);

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
      <div className="hidden lg:flex items-center w-[240px] h-10 px-3 rounded-lg bg-(--color-bg-alt) border border-(--color-border-soft) hover:border-(--color-border) transition-colors group">
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-(--color-muted) shrink-0"
          aria-hidden
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m17 17-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          readOnly
          placeholder="Ürün veya şehir ara..."
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
      <div className="hidden lg:flex items-center gap-2">
        <Link
          href="/giris"
          className="h-9 px-4 inline-flex items-center rounded-lg border border-(--color-border) text-[13px] font-medium text-(--color-foreground) hover:bg-(--color-bg-alt) transition-colors"
        >
          Giriş Yap
        </Link>
        <Link
          href="/kayit"
          className="h-9 px-4 inline-flex items-center rounded-lg bg-(--color-brand) text-(--color-navy) text-[13px] font-semibold hover:bg-(--color-brand-dark) transition-colors shadow-(--shadow-brand)"
        >
          Ücretsiz Başla
        </Link>
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
              <Link
                href="/giris"
                className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-(--color-border) text-sm font-medium"
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="flex-1 h-10 inline-flex items-center justify-center rounded-lg bg-(--color-brand) text-(--color-navy) text-sm font-semibold"
              >
                Ücretsiz Başla
              </Link>
            </div>
          </nav>
        </div>
      )}

      <SearchModalTrigger />
    </>
  );
}
