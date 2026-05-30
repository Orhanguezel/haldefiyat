"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeSearchTr } from "@/lib/tr-slug";

export type ComboboxOption = { value: string; label: string };

type Props = {
  options: ComboboxOption[];
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seçin",
  disabled = false,
  emptyText = "Sonuç yok",
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = normalizeSearchTr(query);
    if (!q) return options;
    return options.filter((option) => normalizeSearchTr(option.label).includes(q));
  }, [options, query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  function select(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open && filtered[activeIndex] ? `${id}-${filtered[activeIndex].value}` : undefined}
        disabled={disabled}
        value={open ? query : selected?.label ?? ""}
        onFocus={() => !disabled && setOpen(true)}
        onClick={() => !disabled && setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
          if (!event.target.value) onChange(null);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }
          if (event.key === "Enter" && open && filtered[activeIndex]) {
            event.preventDefault();
            select(filtered[activeIndex]);
          }
        }}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand) disabled:cursor-not-allowed disabled:opacity-60"
      />
      {open && !disabled && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-[6px] border border-(--color-border) bg-(--color-surface) p-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-(--color-muted)">{emptyText}</div>
          ) : filtered.map((option, index) => (
            <button
              key={option.value}
              id={`${id}-${option.value}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
              className={`block w-full rounded-[4px] px-3 py-2 text-left text-sm ${
                index === activeIndex
                  ? "bg-(--color-brand) text-white"
                  : "text-(--color-foreground) hover:bg-(--color-bg-alt)"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
