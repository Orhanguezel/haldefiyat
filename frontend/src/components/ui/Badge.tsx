import { cn } from "@/lib/utils";

type Color = "brand" | "success" | "danger" | "warning" | "info" | "muted";

const colorClass: Record<Color, string> = {
  brand:   "border-brand/30 bg-brand/10 text-brand",
  success: "border-success/35 bg-success-bg text-success",
  danger:  "border-danger/35 bg-danger-bg text-danger",
  warning: "border-warning/40 bg-warning-bg text-warning",
  info:    "border-info/35 bg-info-bg text-info",
  muted:   "border-border bg-bg-alt text-muted",
};

interface Props {
  color?: Color;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Badge({ color = "muted", className, icon, children }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", colorClass[color], className)}>
      {icon}
      {children}
    </span>
  );
}
