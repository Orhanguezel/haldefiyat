import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ContentCardKind = "data" | "editorial" | "listing" | "commercial" | "advertisement";

const KIND_CLASS: Record<ContentCardKind, string> = {
  data: "border-(--color-border) bg-(--color-surface) shadow-(--shadow-card)",
  editorial: "border-(--color-border-soft) bg-(--color-editorial-bg)",
  listing: "border-(--color-border) bg-(--color-surface) shadow-sm",
  commercial: "border-(--color-brand)/35 bg-(--color-brand-light)",
  advertisement: "border-dashed border-(--color-warning) bg-(--color-warning-bg)",
};

type Props<T extends ElementType> = {
  as?: T;
  kind: ContentCardKind;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/** Shared surface contract; content type remains machine-readable and visual. */
export function ContentCard<T extends ElementType = "article">({
  as,
  kind,
  children,
  className,
  ...rest
}: Props<T>) {
  const Component = as || "article";
  return (
    <Component
      data-content-type={kind}
      className={cn("rounded-xl border", KIND_CLASS[kind], className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
