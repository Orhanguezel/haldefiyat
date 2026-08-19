import mysql from "mysql2/promise";

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [rows] = await connection.query(
  `SELECT ph.recorded_date AS date, ph.market_id AS marketId,
          CAST(ph.avg_price AS DOUBLE) AS price,
          m.name AS market, m.city_name AS city
     FROM hf_price_history ph
     JOIN hf_products p ON p.id = ph.product_id
     JOIN hf_markets m ON m.id = ph.market_id
    WHERE (p.slug = 'limon' OR p.canonical_slug = 'limon')
      AND ph.unit = 'kg'
      AND ph.recorded_date BETWEEN '2026-01-01' AND '2026-08-10'
      AND ph.avg_price > 0
    ORDER BY ph.recorded_date`,
);

const dateOnly = (value) => new Date(value).toISOString().slice(0, 10);
const summarize = (items) => {
  const byMarket = new Map();
  for (const item of items) {
    const values = byMarket.get(item.marketId) ?? [];
    values.push(Number(item.price));
    byMarket.set(item.marketId, values);
  }
  const marketAverages = [...byMarket.values()].map(
    (values) => values.reduce((sum, value) => sum + value, 0) / values.length,
  );
  if (!marketAverages.length) return { records: 0, halls: 0, median: 0, mean: 0 };
  return {
    records: items.length,
    halls: marketAverages.length,
    median: Number(median(marketAverages).toFixed(2)),
    mean: Number((marketAverages.reduce((sum, value) => sum + value, 0) / marketAverages.length).toFixed(2)),
  };
};

const monthly = {};
for (let month = 1; month <= 8; month += 1) {
  const prefix = `2026-${String(month).padStart(2, "0")}`;
  monthly[prefix] = summarize(rows.filter((row) => dateOnly(row.date).startsWith(prefix)));
}

const periodDefinitions = {
  "1-10 Tem": ["2026-07-01", "2026-07-10"],
  "11-20 Tem": ["2026-07-11", "2026-07-20"],
  "21-31 Tem": ["2026-07-21", "2026-07-31"],
  "1-3 Ağu": ["2026-08-01", "2026-08-03"],
  "4-7 Ağu": ["2026-08-04", "2026-08-07"],
  "8-10 Ağu": ["2026-08-08", "2026-08-10"],
};
const periods = Object.fromEntries(
  Object.entries(periodDefinitions).map(([label, [start, end]]) => [
    label,
    summarize(rows.filter((row) => dateOnly(row.date) >= start && dateOnly(row.date) <= end)),
  ]),
);

const recentRows = rows.filter((row) => dateOnly(row.date) >= "2026-08-08");
const byCity = new Map();
for (const row of recentRows) {
  const values = byCity.get(row.city) ?? [];
  values.push(Number(row.price));
  byCity.set(row.city, values);
}
const recentCities = [...byCity.entries()]
  .map(([city, values]) => ({
    city,
    average: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)),
    records: values.length,
  }))
  .sort((a, b) => b.records - a.records || a.average - b.average);

console.log(JSON.stringify({ monthly, periods, recentCities, totalRows: rows.length }, null, 2));
await connection.end();
