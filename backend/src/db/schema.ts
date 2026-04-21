import {
  mysqlTable,
  int,
  varchar,
  decimal,
  date,
  tinyint,
  datetime,
  mysqlEnum,
  json,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const hfMarkets = mysqlTable(
  "hf_markets",
  {
    id:           int("id").autoincrement().primaryKey(),
    slug:         varchar("slug", { length: 128 }).notNull(),
    name:         varchar("name", { length: 255 }).notNull(),
    cityName:     varchar("city_name", { length: 128 }).notNull(),
    regionSlug:   varchar("region_slug", { length: 64 }),
    sourceKey:    varchar("source_key", { length: 64 }),
    displayOrder: int("display_order").notNull().default(0),
    isActive:     tinyint("is_active").notNull().default(1),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_markets_slug_uq").on(t.slug),
    index("hf_markets_city_idx").on(t.cityName),
  ],
);

export const hfProducts = mysqlTable(
  "hf_products",
  {
    id:           int("id").autoincrement().primaryKey(),
    slug:         varchar("slug", { length: 128 }).notNull(),
    nameTr:       varchar("name_tr", { length: 255 }).notNull(),
    categorySlug: varchar("category_slug", { length: 64 }).notNull().default("diger"),
    unit:         varchar("unit", { length: 32 }).notNull().default("kg"),
    aliases:      json("aliases").$type<string[]>(),
    displayOrder: int("display_order").notNull().default(0),
    isActive:     tinyint("is_active").notNull().default(1),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_products_slug_uq").on(t.slug),
    index("hf_products_category_idx").on(t.categorySlug),
  ],
);

export const hfPriceHistory = mysqlTable(
  "hf_price_history",
  {
    id:           int("id").autoincrement().primaryKey(),
    productId:    int("product_id").notNull(),
    marketId:     int("market_id").notNull(),
    minPrice:     decimal("min_price", { precision: 12, scale: 2 }),
    maxPrice:     decimal("max_price", { precision: 12, scale: 2 }),
    avgPrice:     decimal("avg_price", { precision: 12, scale: 2 }).notNull(),
    currency:     varchar("currency", { length: 8 }).notNull().default("TRY"),
    unit:         varchar("unit", { length: 32 }).notNull().default("kg"),
    recordedDate: date("recorded_date").notNull(),
    sourceApi:    varchar("source_api", { length: 64 }).notNull().default("manual"),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_ph_product_market_date_uq").on(t.productId, t.marketId, t.recordedDate),
    index("hf_ph_recorded_date").on(t.recordedDate),
    index("hf_ph_source_api").on(t.sourceApi),
  ],
);

export const hfAlerts = mysqlTable(
  "hf_alerts",
  {
    id:               int("id").autoincrement().primaryKey(),
    productId:        int("product_id").notNull(),
    marketId:         int("market_id"),
    thresholdPrice:   decimal("threshold_price", { precision: 12, scale: 2 }),
    direction:        mysqlEnum("direction", ["above", "below"]),
    contactEmail:     varchar("contact_email", { length: 255 }),
    contactTelegram:  varchar("contact_telegram", { length: 128 }),
    isActive:         tinyint("is_active").notNull().default(1),
    lastTriggered:    datetime("last_triggered", { fsp: 3 }),
    createdAt:        datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("hf_alerts_product_idx").on(t.productId)],
);

export const hfEtlRuns = mysqlTable(
  "hf_etl_runs",
  {
    id:           int("id").autoincrement().primaryKey(),
    sourceApi:    varchar("source_api", { length: 64 }).notNull(),
    runDate:      date("run_date").notNull(),
    rowsFetched:  int("rows_fetched").notNull().default(0),
    rowsInserted: int("rows_inserted").notNull().default(0),
    rowsSkipped:  int("rows_skipped").notNull().default(0),
    durationMs:   int("duration_ms"),
    status:       mysqlEnum("status", ["ok", "partial", "error"]).notNull().default("ok"),
    errorMsg:     text("error_msg"),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("hf_etl_runs_source_date").on(t.sourceApi, t.runDate)],
);

export const hfAnnualProduction = mysqlTable(
  "hf_annual_production",
  {
    id:            int("id").autoincrement().primaryKey(),
    year:          int("year").notNull(),
    species:       varchar("species", { length: 255 }).notNull(),
    speciesSlug:   varchar("species_slug", { length: 128 }).notNull(),
    categorySlug:  varchar("category_slug", { length: 64 }).notNull().default("diger"),
    regionSlug:    varchar("region_slug", { length: 64 }).notNull().default("tr"),
    productionTon: decimal("production_ton", { precision: 14, scale: 2 }).notNull(),
    sourceApi:     varchar("source_api", { length: 64 }).notNull(),
    note:          varchar("note", { length: 255 }),
    createdAt:     datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:     datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_prod_year_species_region_uq").on(t.year, t.speciesSlug, t.regionSlug),
    index("hf_prod_year_idx").on(t.year),
    index("hf_prod_category_idx").on(t.categorySlug),
    index("hf_prod_region_idx").on(t.regionSlug),
    index("hf_prod_source_idx").on(t.sourceApi),
  ],
);

export const hfAnnualEtlRuns = mysqlTable(
  "hf_annual_etl_runs",
  {
    id:           int("id").autoincrement().primaryKey(),
    sourceApi:    varchar("source_api", { length: 64 }).notNull(),
    runAt:        datetime("run_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    rowsFetched:  int("rows_fetched").notNull().default(0),
    rowsInserted: int("rows_inserted").notNull().default(0),
    rowsSkipped:  int("rows_skipped").notNull().default(0),
    durationMs:   int("duration_ms"),
    status:       mysqlEnum("status", ["ok", "partial", "error"]).notNull().default("ok"),
    errorMsg:     text("error_msg"),
  },
  (t) => [index("hf_aer_source_time").on(t.sourceApi, t.runAt)],
);
