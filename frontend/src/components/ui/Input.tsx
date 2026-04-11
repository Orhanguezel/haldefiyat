import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...rest}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm outline-none transition-all",
          "placeholder:text-faint",
          error
            ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
            : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
