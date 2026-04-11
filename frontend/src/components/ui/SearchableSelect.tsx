"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function normalizeSearch(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled,
}: SearchableSelectProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(selected?.label ?? "");
  }, [selected?.label]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    if (!normalizedQuery) return options;
    return options.filter((option) => normalizeSearch(option.label).includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function selectOption(next: Option | null) {
    onChange(next?.value ?? "");
    setQuery(next?.label ?? "");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      {label ? <label htmlFor={inputId} className="text-xs font-medium text-foreground">{label}</label> : null}
      <div className="relative">
        <input
          id={inputId}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && filtered[activeIndex] ? `${inputId}-option-${activeIndex}` : undefined}
          onFocus={() => !disabled && setOpen(true)}
          onClick={() => !disabled && setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            if (!next.trim() && value) onChange("");
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              setOpen(true);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => Math.min(current + 1, filtered.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            }
            if (event.key === "Enter" && open && filtered[activeIndex]) {
              event.preventDefault();
              selectOption(filtered[activeIndex]);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm outline-none transition-all",
            "placeholder:text-faint",
            error
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        />
        {open && !disabled ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-border-soft bg-surface shadow-lg"
          >
            {filtered.length ? filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <button
                  key={option.value}
                  id={`${inputId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm transition-colors",
                    isSelected ? "bg-brand text-white" : isActive ? "bg-brand/10 text-foreground" : "text-foreground hover:bg-brand/10",
                  )}
                >
                  {option.label}
                </button>
              );
            }) : (
              <div className="px-4 py-3 text-sm text-muted">Sonuç bulunamadı.</div>
            )}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
