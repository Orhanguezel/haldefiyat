export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-surface" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-border-soft bg-surface p-6">
              <div className="mb-4 h-4 w-24 animate-pulse rounded bg-bg-alt" />
              <div className="mb-3 h-8 w-32 animate-pulse rounded bg-bg-alt" />
              <div className="h-3 w-full animate-pulse rounded bg-bg-alt" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface p-6">
          <div className="mb-4 flex items-center gap-3 text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand" />
            <span className="text-sm">Sayfa hazırlanıyor...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-bg-alt" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
