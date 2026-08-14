import Link from "next/link";

type Props = {
  title: string;
  description: string;
  action?: { href: string; label: string };
};

export function DashboardEmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-[10px] border border-dashed border-(--color-border) bg-(--color-bg-alt) p-7 text-center">
      <h2 className="font-(family-name:--font-display) text-base font-bold text-(--color-foreground)">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-(--color-muted)">{description}</p>
      {action ? (
        <Link href={action.href} className="mt-4 inline-flex min-h-11 items-center rounded-[7px] bg-(--color-brand) px-4 text-sm font-semibold text-(--color-brand-fg)">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
