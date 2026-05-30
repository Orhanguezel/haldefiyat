"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { NavGroup } from "./HeaderNavClient";

interface Props {
  group: NavGroup;
  isActive: (href: string) => boolean;
}

/** Desktop nav grup dropdown'u — hover veya tikla ile acilir, disari tikla/Escape kapatir. */
export function HeaderNavDropdown({ group, isActive }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const groupActive = group.items.some((item) => isActive(item.href));

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={clsx(
          "inline-flex items-center gap-1 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
          groupActive
            ? "text-(--color-brand) bg-(--color-brand-light)"
            : "text-(--color-muted) hover:text-(--color-foreground) hover:bg-(--color-bg-alt)",
        )}
      >
        {group.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={clsx("transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 min-w-[210px] pt-1.5">
          <div className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) py-1 shadow-xl shadow-black/5">
            {group.items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={clsx(
                  "block px-4 py-2.5 text-[13px] font-medium transition-colors",
                  isActive(item.href)
                    ? "text-(--color-brand) bg-(--color-brand-light)"
                    : "text-(--color-foreground) hover:bg-(--color-bg-alt) hover:text-(--color-brand)",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
