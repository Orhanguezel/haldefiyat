import { cn } from "@/lib/utils";

type Color = "brand" | "success" | "danger" | "warning" | "muted";

const colorClass: Record<Color, string> = {
  brand:   "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  danger:  "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  muted:   "bg-bg-alt text-muted",
};

interface Props {
  color?: Color;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ color = "muted", className, children }: Props) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", colorClass[color], className)}>
      {children}
    </span>
  );
}
