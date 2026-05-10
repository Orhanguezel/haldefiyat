"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  showingStart: number;
  showingEnd: number;
  loading?: boolean;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  showingStart,
  showingEnd,
  loading = false,
  pageSizeOptions = [50, 100, 200, 250],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  return (
    <div className="flex flex-col gap-3 font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.1em] text-(--color-muted) md:flex-row md:items-center md:justify-between">
      <span>
        {showingStart}-{showingEnd} / {total} kayıt
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Sayfa başına kayıt"
          className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-2 py-1 text-[11px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
          disabled={loading}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / sayfa
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={loading || safePage <= 1}
          className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-1.5 font-semibold text-(--color-muted) transition-colors enabled:hover:text-(--color-foreground) disabled:cursor-not-allowed disabled:opacity-40"
        >
          Önceki
        </button>

        <span className="px-1 text-(--color-foreground)">
          {safePage} / {safeTotalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
          disabled={loading || safePage >= safeTotalPages}
          className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-1.5 font-semibold text-(--color-muted) transition-colors enabled:hover:text-(--color-foreground) disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
