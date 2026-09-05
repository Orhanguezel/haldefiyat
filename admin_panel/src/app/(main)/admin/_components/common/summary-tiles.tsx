'use client';

export type SummaryTile = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  tone?: string;
  active?: boolean;
  onClick?: () => void;
};

/** Tiklanabilir ozet sayaclari — admin liste sayfalarinin ortak ust seridi. */
export function SummaryTiles({ tiles, columns = 'sm:grid-cols-3 xl:grid-cols-6' }: { tiles: SummaryTile[]; columns?: string }) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          onClick={tile.onClick}
          disabled={!tile.onClick}
          className={`rounded-lg border p-3 text-left transition ${tile.onClick ? 'hover:border-primary/40' : 'cursor-default'} ${tile.active ? 'border-primary bg-primary/5' : 'bg-background'}`}
        >
          <div className="text-xs text-muted-foreground">{tile.label}</div>
          <div className={`text-2xl font-semibold tabular-nums ${tile.tone ?? ''}`}>{typeof tile.value === 'number' ? tile.value.toLocaleString('tr-TR') : tile.value}</div>
          {tile.hint ? <div className="truncate text-xs text-muted-foreground">{tile.hint}</div> : null}
        </button>
      ))}
    </div>
  );
}
