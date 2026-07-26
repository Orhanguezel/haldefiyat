type DatedAverage = {
  recordedDate: string;
  avgPrice: number | string;
};

export type PriceTrend = {
  periodDays: number;
  changePct: number;
  direction: "yükseliş" | "düşüş" | "yatay";
};

export type ProductMover = {
  productSlug: string;
  productName: string;
  changePct: number;
  direction: "yükseldi" | "düştü";
};

function numeric(value: number | string): number | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function mean(values: number[]): number | null {
  return values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;
}

/**
 * Günlük hal ortalamalarını önce gün bazında tekilleştirir; son N günün
 * ortalamasını bir önceki N günlük dönemle kıyaslar. Böylece bazı günlerde
 * daha çok satır bildiren haller trendi orantısız biçimde etkilemez.
 */
export function calculateWindowTrend(
  rows: DatedAverage[],
  periodDays: number,
): PriceTrend | null {
  if (!Number.isInteger(periodDays) || periodDays < 1) return null;

  const byDate = new Map<string, number[]>();
  for (const row of rows) {
    const value = numeric(row.avgPrice);
    const date = row.recordedDate.slice(0, 10);
    if (value == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const values = byDate.get(date) ?? [];
    values.push(value);
    byDate.set(date, values);
  }

  const daily = [...byDate.entries()]
    .map(([date, values]) => ({ date, average: mean(values) as number }))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (daily.length < periodDays * 2) return null;
  const current = mean(daily.slice(0, periodDays).map((row) => row.average));
  const previous = mean(
    daily.slice(periodDays, periodDays * 2).map((row) => row.average),
  );
  if (current == null || previous == null || previous === 0) return null;

  const changePct = Math.round(((current - previous) / previous) * 1_000) / 10;
  return {
    periodDays,
    changePct,
    direction:
      Math.abs(changePct) < 0.1
        ? "yatay"
        : changePct > 0
          ? "yükseliş"
          : "düşüş",
  };
}

/**
 * Bir haldeki her ürünün en yeni iki yayın gününü karşılaştırır. Aynı ürün ve
 * günde birden fazla satır varsa önce günlük ortalama alınır.
 */
export function calculateProductMovers(
  rows: Array<DatedAverage & {
    productSlug: string;
    canonicalProduct?: string | null;
    productName: string;
  }>,
  limit = 3,
): ProductMover[] {
  const products = new Map<string, {
    name: string;
    days: Map<string, number[]>;
  }>();

  for (const row of rows) {
    const value = numeric(row.avgPrice);
    const date = row.recordedDate.slice(0, 10);
    if (value == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const productSlug = row.canonicalProduct || row.productSlug;
    const product = products.get(productSlug) ?? {
      name: row.productName,
      days: new Map<string, number[]>(),
    };
    const values = product.days.get(date) ?? [];
    values.push(value);
    product.days.set(date, values);
    products.set(productSlug, product);
  }

  return [...products.entries()]
    .flatMap(([productSlug, product]) => {
      const days = [...product.days.entries()]
        .map(([date, values]) => ({ date, average: mean(values) as number }))
        .sort((a, b) => b.date.localeCompare(a.date));
      if (days.length < 2 || days[1].average === 0) return [];
      const changePct =
        Math.round(((days[0].average - days[1].average) / days[1].average) * 1_000) / 10;
      if (Math.abs(changePct) < 0.1) return [];
      return [{
        productSlug,
        productName: product.name,
        changePct,
        direction: changePct > 0 ? "yükseldi" as const : "düştü" as const,
      }];
    })
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, Math.max(0, limit));
}
