import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size    = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:   "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-bg-alt text-foreground border border-border hover:bg-border-soft",
  outline:   "bg-transparent text-foreground border border-border hover:border-brand hover:text-brand",
  ghost:     "text-muted hover:bg-bg-alt",
  danger:    "bg-danger text-white hover:brightness-90",
  success:   "bg-success text-white hover:brightness-90",
};

const sizeClass: Record<Size, string> = {
  sm: "min-h-11 px-3 py-2 text-xs",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-7 py-3 text-base",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, disabled, className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className
      )}
    >
      {loading ? <span aria-hidden className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : null}
      {children}
    </button>
  );
}
