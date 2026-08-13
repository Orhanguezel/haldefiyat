import { AlertTriangle, Database, LoaderCircle, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "empty" | "error" | "offline" | "loading";

const iconByKind = {
  empty: Database,
  error: AlertTriangle,
  offline: WifiOff,
  loading: LoaderCircle,
};

export function StatusState({
  kind,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  kind: Kind;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const Icon = iconByKind[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "loading" ? "polite" : undefined}
      className={cn("flex flex-col items-center justify-center text-center", compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-12", className)}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg-alt) text-(--color-muted)">
        <Icon className={cn("h-5 w-5", kind === "loading" && "animate-spin")} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-(--color-foreground)">{title}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-(--color-muted)">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
