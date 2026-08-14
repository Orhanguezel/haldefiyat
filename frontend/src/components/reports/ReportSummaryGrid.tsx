export interface ReportSummaryItem {
  label: string;
  value: string;
  note?: string;
}
export default function ReportSummaryGrid({
  items,
  className = "",
}: {
  items: ReportSummaryItem[];
  className?: string;
}) {
  return (
    <dl className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`.trim()}>
      {items.map((item) => (
        <div key={item.label} className="rounded-[14px] border border-(--color-border-soft) bg-(--color-bg-alt) p-4">
          <dt className="font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.1em] text-(--color-muted)">{item.label}</dt>
          <dd className="mt-1 text-[15px] font-bold text-(--color-foreground)">{item.value}</dd>
          {item.note ? <p className="mt-1 text-xs leading-5 text-(--color-muted)">{item.note}</p> : null}
        </div>
      ))}
    </dl>
  );
}
