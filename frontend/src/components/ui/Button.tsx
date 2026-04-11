import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size    = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:   "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-bg-alt text-foreground border border-border hover:bg-border-soft",
  ghost:     "text-muted hover:bg-bg-alt",
  danger:    "bg-danger text-white hover:brightness-90",
  success:   "bg-success text-white hover:brightness-90",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
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
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className
      )}
    >
      {loading ? <span className="animate-spin mr-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : null}
      {children}
    </button>
  );
}
