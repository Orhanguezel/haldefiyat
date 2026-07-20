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
    marketType:   mysqlEnum("market_type", ["hal", "borsa", "resmi", "kooperatif"]).notNull().default("hal"),
    displayOrder: int("display_order").notNull().default(0),
    seoIndex:     tinyint("seo_index").notNull().default(1),
    isActive:     tinyint("is_active").notNull().default(1),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_markets_slug_uq").on(t.slug),
    index("hf_markets_city_idx").on(t.cityName),
    index("hf_markets_type_idx").on(t.marketType, t.isActive),
    index("hf_markets_seo_idx").on(t.seoIndex, t.displayOrder),
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
    displayName:  varchar("display_name", { length: 160 }),
    canonicalSlug: varchar("canonical_slug", { length: 128 }),
    familySlug:   varchar("family_slug", { length: 128 }),
    seoIndex:     tinyint("seo_index").notNull().default(0),
    dataQuality:  tinyint("data_quality").notNull().default(0),
    searchVolume: int("search_volume").notNull().default(0),
    displayOrder: int("display_order").notNull().default(0),
    isActive:     tinyint("is_active").notNull().default(1),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_products_slug_uq").on(t.slug),
    index("hf_products_category_idx").on(t.categorySlug),
    index("hf_products_canonical_idx").on(t.canonicalSlug),
    index("hf_products_family_idx").on(t.familySlug),
    index("hf_products_seo_idx").on(t.seoIndex, t.displayOrder),
  ],
);

/** Hal x tarih karantinasi — gerekce 048_market_blackouts_schema.sql'de. */
export const hfMarketBlackouts = mysqlTable(
  "hf_market_blackouts",
  {
    id:        int("id").autoincrement().primaryKey(),
    marketId:  int("market_id").notNull(),
    fromDate:  date("from_date").notNull(),
    toDate:    date("to_date").notNull(),
    reason:    varchar("reason", { length: 255 }).notNull(),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("idx_blackout_market").on(t.marketId, t.fromDate, t.toDate)],
);

/** Gonderilen bultenlerin arsivi — gerekce 045_newsletter_sends_schema.sql'de. */
export const hfNewsletterSends = mysqlTable(
  "hf_newsletter_sends",
  {
    id:         varchar("id", { length: 36 }).notNull().primaryKey(),
    kind:       varchar("kind", { length: 16 }).notNull().default("weekly"),
    status:     varchar("status", { length: 16 }).notNull().default("draft"),
    subject:    varchar("subject", { length: 255 }).notNull(),
    html:       text("html").notNull(),
    recipients: int("recipients").notNull().default(0),
    successes:  int("successes").notNull().default(0),
    failures:   int("failures").notNull().default(0),
    reason:     varchar("reason", { length: 255 }),
    editedAt:   datetime("edited_at", { fsp: 3 }),
    sentAt:     datetime("sent_at", { fsp: 3 }),
    createdAt:  datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:  datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("idx_sends_status").on(t.status, t.createdAt)],
);

/** Haftalik bultenin sabit sepeti — secim gerekcesi 044_basket_products_schema.sql'de. */
export const hfBasketProducts = mysqlTable(
  "hf_basket_products",
  {
    slug:      varchar("slug", { length: 128 }).notNull().primaryKey(),
    sortOrder: int("sort_order").notNull().default(0),
    isActive:  tinyint("is_active").notNull().default(1),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("idx_basket_active_order").on(t.isActive, t.sortOrder)],
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
    index("idx_ph_date_product_market").on(t.recordedDate, t.productId, t.marketId),
    index("hf_ph_source_api").on(t.sourceApi),
  ],
);

export const hfAlerts = mysqlTable(
  "hf_alerts",
  {
    id:               int("id").autoincrement().primaryKey(),
    userId:           varchar("user_id", { length: 36 }),
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
  (t) => [
    index("hf_alerts_product_idx").on(t.productId),
    index("hf_alerts_user_idx").on(t.userId),
  ],
);

export const hfUserFavorites = mysqlTable(
  "hf_user_favorites",
  {
    id:        int("id").autoincrement().primaryKey(),
    userId:    varchar("user_id", { length: 36 }).notNull(),
    productId: int("product_id").notNull(),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_uf_user_product_uq").on(t.userId, t.productId),
    index("hf_uf_user_idx").on(t.userId),
  ],
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

export const hfIndexSnapshots = mysqlTable(
  "hf_index_snapshots",
  {
    id:            int("id").autoincrement().primaryKey(),
    indexWeek:     varchar("index_week", { length: 8 }).notNull(),
    indexValue:    decimal("index_value", { precision: 10, scale: 4 }).notNull(),
    baseWeek:      varchar("base_week", { length: 8 }).notNull(),
    basketAvg:     decimal("basket_avg", { precision: 10, scale: 4 }).notNull(),
    productsCount: int("products_count").notNull().default(0),
    weekStart:     date("week_start").notNull(),
    weekEnd:       date("week_end").notNull(),
    createdAt:     datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:     datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [uniqueIndex("hf_idx_week_uq").on(t.indexWeek)],
);

export const hfAnalysisReports = mysqlTable(
  "hf_analysis_reports",
  {
    id:           int("id").autoincrement().primaryKey(),
    slug:         varchar("slug", { length: 180 }).notNull(),
    title:        varchar("title", { length: 500 }).notNull(),
    summary:      text("summary").notNull(),
    metaTitle:    varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    ogImage:      varchar("og_image", { length: 500 }),
    imageAlt:     varchar("image_alt", { length: 255 }),
    content:      text("content").notNull(),
    author:       varchar("author", { length: 128 }).notNull().default("HaldeFiyat Veri Ekibi"),
    authorId:     int("author_id"),
    tags:         json("tags").$type<string[]>(),
    isoWeek:      varchar("iso_week", { length: 8 }).notNull(),
    weekStart:    date("week_start").notNull(),
    weekEnd:      date("week_end").notNull(),
    reportDate:   date("report_date").notNull(),
    source:       mysqlEnum("source", ["auto", "manual"]).notNull().default("auto"),
    status:       mysqlEnum("status", ["draft", "published", "archived"]).notNull().default("draft"),
    totalRecords: int("total_records").notNull().default(0),
    publishedAt:  datetime("published_at", { fsp: 3 }),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_analysis_reports_slug_uq").on(t.slug),
    index("hf_analysis_reports_status_date_idx").on(t.status, t.reportDate),
    index("hf_analysis_reports_week_idx").on(t.isoWeek),
    index("hf_analysis_reports_author_idx").on(t.authorId),
  ],
);

export const hfAuthors = mysqlTable(
  "hf_authors",
  {
    id:           int("id").autoincrement().primaryKey(),
    slug:         varchar("slug", { length: 120 }).notNull(),
    fullName:     varchar("full_name", { length: 160 }).notNull(),
    title:        varchar("title", { length: 200 }),
    bio:          text("bio"),
    expertise:    json("expertise").$type<string[]>(),
    avatarUrl:    varchar("avatar_url", { length: 500 }),
    credentials:  varchar("credentials", { length: 300 }),
    socialLinks:  json("social_links").$type<Record<string, string>>(),
    email:        varchar("email", { length: 255 }),
    isActive:     tinyint("is_active").notNull().default(1),
    displayOrder: int("display_order").notNull().default(100),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_authors_slug_uq").on(t.slug),
    index("hf_authors_active_idx").on(t.isActive, t.displayOrder),
  ],
);

export const hfProductEditorial = mysqlTable(
  "hf_product_editorial",
  {
    id:                  int("id").autoincrement().primaryKey(),
    productSlug:         varchar("product_slug", { length: 128 }).notNull(),
    aboutMd:             text("about_md").notNull(),
    priceFactorsMd:      text("price_factors_md").notNull(),
    seasonMd:            text("season_md").notNull(),
    productionRegionMd:  text("production_region_md").notNull(),
    qualityIndicatorsMd: text("quality_indicators_md"),
    culinaryUsesMd:      text("culinary_uses_md"),
    relatedSlugs:        json("related_slugs").$type<string[]>(),
    source:              mysqlEnum("source", ["manual", "ai_draft", "ai_reviewed"]).notNull().default("manual"),
    reviewedBy:          varchar("reviewed_by", { length: 36 }),
    reviewedAt:          datetime("reviewed_at", { fsp: 3 }),
    publishedAt:         datetime("published_at", { fsp: 3 }),
    createdAt:           datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:           datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_pe_slug_uq").on(t.productSlug),
    index("hf_pe_published_idx").on(t.publishedAt),
  ],
);

export const hfSeoSnapshots = mysqlTable(
  "hf_seo_snapshots",
  {
    id:              int("id").autoincrement().primaryKey(),
    snapshotDate:    date("snapshot_date").notNull(),
    url:             varchar("url", { length: 512 }).notNull(),
    coverageState:   varchar("coverage_state", { length: 64 }),
    lastCrawled:     datetime("last_crawled", { fsp: 3 }),
    googleCanonical: varchar("google_canonical", { length: 512 }),
    userCanonical:   varchar("user_canonical", { length: 512 }),
    clicks28d:       int("clicks_28d").notNull().default(0),
    impressions28d:  int("impressions_28d").notNull().default(0),
    positionAvg:     decimal("position_avg", { precision: 5, scale: 2 }),
    ctrPct:          decimal("ctr_pct", { precision: 5, scale: 2 }),
    createdAt:       datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:       datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_seo_snapshots_uq").on(t.snapshotDate, t.url),
    index("hf_seo_snapshots_date_idx").on(t.snapshotDate),
  ],
);

export const hfFirms = mysqlTable(
  "hf_firms",
  {
    id:            int("id").autoincrement().primaryKey(),
    externalId:    varchar("external_id", { length: 32 }).notNull(),
    slug:          varchar("slug", { length: 180 }).notNull(),
    name:          varchar("name", { length: 255 }).notNull(),
    contactPerson: varchar("contact_person", { length: 255 }),
    phone:         varchar("phone", { length: 128 }),
    address:       text("address"),
    citySlug:      varchar("city_slug", { length: 96 }),
    districtSlug:  varchar("district_slug", { length: 128 }),
    photoUrl:      varchar("photo_url", { length: 512 }),
    sourceUrl:     varchar("source_url", { length: 512 }).notNull(),
    firmType:      mysqlEnum("firm_type", ["komisyoncu", "soguk_hava", "nakliye", "zirai_ilac"]).notNull().default("komisyoncu"),
    categories:    json("categories").$type<string[]>(),
    ownerUserId:   varchar("owner_user_id", { length: 36 }),
    source:        mysqlEnum("source", ["halkatalogu", "user"]).notNull().default("halkatalogu"),
    status:        mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("approved"),
    description:   text("description"),
    claimStatus:   mysqlEnum("claim_status", ["unclaimed", "pending", "verified"]).notNull().default("unclaimed"),
    isActive:      tinyint("is_active").notNull().default(1),
    seoIndex:      tinyint("seo_index").notNull().default(0),
    firstSeenAt:   datetime("first_seen_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    lastSeenAt:    datetime("last_seen_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    raw:           json("raw").$type<Record<string, unknown>>(),
    createdAt:     datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:     datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_firms_external_uq").on(t.externalId),
    uniqueIndex("hf_firms_slug_uq").on(t.slug),
    index("hf_firms_city_idx").on(t.citySlug, t.districtSlug),
    index("hf_firms_type_idx").on(t.firmType, t.isActive),
    index("hf_firms_seo_idx").on(t.seoIndex, t.citySlug),
    index("hf_firms_owner_idx").on(t.ownerUserId),
    index("hf_firms_status_idx").on(t.status, t.source),
    index("hf_firms_claim_status_idx").on(t.claimStatus),
    index("hf_firms_seen_idx").on(t.lastSeenAt),
  ],
);

export const hfFirmProducts = mysqlTable(
  "hf_firm_products",
  {
    id:           int("id").autoincrement().primaryKey(),
    firmId:       int("firm_id").notNull(),
    productSlug:  varchar("product_slug", { length: 128 }),
    productName:  varchar("product_name", { length: 255 }).notNull(),
    note:         varchar("note", { length: 500 }),
    price:        varchar("price", { length: 128 }),
    displayOrder: int("display_order").notNull().default(100),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("hf_firm_products_firm_idx").on(t.firmId),
    index("hf_firm_products_product_idx").on(t.productSlug),
  ],
);

export const hfFirmPrices = mysqlTable(
  "hf_firm_prices",
  {
    id:           int("id").autoincrement().primaryKey(),
    firmId:       int("firm_id").notNull(),
    productSlug:  varchar("product_slug", { length: 128 }),
    productName:  varchar("product_name", { length: 255 }).notNull(),
    unit:         varchar("unit", { length: 32 }).notNull().default("kg"),
    minPrice:     decimal("min_price", { precision: 12, scale: 2 }),
    maxPrice:     decimal("max_price", { precision: 12, scale: 2 }),
    avgPrice:     decimal("avg_price", { precision: 12, scale: 2 }).notNull(),
    recordedDate: date("recorded_date", { mode: "string" }).notNull(),
    isSuspicious: tinyint("is_suspicious").notNull().default(0),
    createdBy:    varchar("created_by", { length: 36 }),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_firm_prices_uq").on(t.firmId, t.productName, t.recordedDate),
    index("hf_firm_prices_firm_date_idx").on(t.firmId, t.recordedDate),
    index("hf_firm_prices_product_idx").on(t.productSlug),
  ],
);

export const hfFirmClaims = mysqlTable(
  "hf_firm_claims",
  {
    id:         int("id").autoincrement().primaryKey(),
    firmId:     int("firm_id").notNull(),
    userId:     varchar("user_id", { length: 36 }).notNull(),
    status:     mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
    evidence:   text("evidence"),
    reviewedBy: varchar("reviewed_by", { length: 36 }),
    reviewedAt: datetime("reviewed_at", { fsp: 3 }),
    createdAt:  datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:  datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("hf_firm_claims_firm_idx").on(t.firmId),
    index("hf_firm_claims_user_idx").on(t.userId),
    index("hf_firm_claims_status_idx").on(t.status, t.createdAt),
  ],
);

export const hfFirmDeals = mysqlTable(
  "hf_firm_deals",
  {
    id:           int("id").autoincrement().primaryKey(),
    firmId:       int("firm_id").notNull(),
    status:       mysqlEnum("status", ["lead", "contacted", "negotiating", "won", "lost"]).notNull().default("lead"),
    dealType:     mysqlEnum("deal_type", ["reklam", "sponsorluk", "premium", "diger"]).notNull().default("reklam"),
    value:        decimal("value", { precision: 12, scale: 2 }),
    currency:     varchar("currency", { length: 8 }).notNull().default("TRY"),
    owner:        varchar("owner", { length: 128 }),
    notes:        text("notes"),
    contactedAt:  datetime("contacted_at", { fsp: 3 }),
    nextActionAt: datetime("next_action_at", { fsp: 3 }),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("hf_firm_deals_firm_idx").on(t.firmId),
    index("hf_firm_deals_status_idx").on(t.status, t.nextActionAt),
  ],
);

export const hfFirmSponsorships = mysqlTable(
  "hf_firm_sponsorships",
  {
    id:            int("id").autoincrement().primaryKey(),
    firmId:        int("firm_id").notNull(),
    tier:          varchar("tier", { length: 32 }).notNull().default("standard"),
    placement:     mysqlEnum("placement", ["il", "kategori", "global"]).notNull().default("il"),
    placementSlug: varchar("placement_slug", { length: 128 }),
    startsAt:      datetime("starts_at", { fsp: 3 }).notNull(),
    endsAt:        datetime("ends_at", { fsp: 3 }).notNull(),
    isActive:      tinyint("is_active").notNull().default(1),
    createdAt:     datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:     datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("hf_firm_sponsorships_firm_idx").on(t.firmId),
    index("hf_firm_sponsorships_active_idx").on(t.isActive, t.placement, t.placementSlug, t.startsAt, t.endsAt),
  ],
);

export const hfPressContacts = mysqlTable(
  "hf_press_contacts",
  {
    id:              int("id").autoincrement().primaryKey(),
    organization:    varchar("organization", { length: 255 }).notNull(),
    publicationType: mysqlEnum("publication_type", ["newspaper", "website", "association", "chamber", "agency", "other"]).notNull().default("website"),
    contactName:     varchar("contact_name", { length: 255 }),
    email:           varchar("email", { length: 255 }).notNull(),
    phone:           varchar("phone", { length: 64 }),
    city:            varchar("city", { length: 128 }),
    tags:            json("tags").$type<string[]>(),
    status:          mysqlEnum("status", ["target", "contacted", "replied", "published", "blocked"]).notNull().default("target"),
    notes:           text("notes"),
    lastContactedAt: datetime("last_contacted_at", { fsp: 3 }),
    createdAt:       datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:       datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_press_contacts_email_uq").on(t.email),
    index("hf_press_contacts_status_idx").on(t.status),
    index("hf_press_contacts_type_city_idx").on(t.publicationType, t.city),
  ],
);

export const hfPressCampaigns = mysqlTable(
  "hf_press_campaigns",
  {
    id:          int("id").autoincrement().primaryKey(),
    slug:        varchar("slug", { length: 160 }).notNull(),
    name:        varchar("name", { length: 255 }).notNull(),
    subject:     varchar("subject", { length: 255 }).notNull(),
    pitch:       text("pitch").notNull(),
    templateKey: varchar("template_key", { length: 128 }),
    segmentTags: json("segment_tags").$type<string[]>(),
    status:      mysqlEnum("status", ["draft", "active", "completed", "archived"]).notNull().default("draft"),
    scheduledAt: datetime("scheduled_at", { fsp: 3 }),
    sentAt:      datetime("sent_at", { fsp: 3 }),
    createdAt:   datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:   datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_press_campaigns_slug_uq").on(t.slug),
    index("hf_press_campaigns_status_idx").on(t.status),
  ],
);

export const hfPressOutreachLogs = mysqlTable(
  "hf_press_outreach_logs",
  {
    id:           int("id").autoincrement().primaryKey(),
    campaignId:   int("campaign_id").notNull(),
    contactId:    int("contact_id").notNull(),
    channel:      mysqlEnum("channel", ["email", "phone", "social", "other"]).notNull().default("email"),
    status:       mysqlEnum("status", ["planned", "sent", "replied", "published", "bounced", "rejected"]).notNull().default("planned"),
    note:         text("note"),
    publishedUrl: varchar("published_url", { length: 512 }),
    contactedAt:  datetime("contacted_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("hf_press_logs_campaign_idx").on(t.campaignId),
    index("hf_press_logs_contact_idx").on(t.contactId),
    index("hf_press_logs_status_idx").on(t.status),
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

export const hfRetailPrices = mysqlTable(
  "hf_retail_prices",
  {
    id:             int("id").autoincrement().primaryKey(),
    productId:      int("product_id"),
    chainSlug:      varchar("chain_slug", { length: 64 }).notNull(),
    price:          decimal("price", { precision: 12, scale: 2 }).notNull(),
    currency:       varchar("currency", { length: 8 }).notNull().default("TRY"),
    unit:           varchar("unit", { length: 32 }).notNull().default("kg"),
    productNameRaw: varchar("product_name_raw", { length: 255 }),
    productUrl:     varchar("product_url", { length: 512 }),
    recordedDate:   date("recorded_date").notNull(),
    createdAt:      datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_rp_product_chain_date_uq").on(t.productId, t.chainSlug, t.recordedDate),
    index("hf_rp_chain_date_idx").on(t.chainSlug, t.recordedDate),
    index("hf_rp_product_idx").on(t.productId),
  ],
);

export const hfCompetitorSites = mysqlTable(
  "hf_competitor_sites",
  {
    id:                 int("id").autoincrement().primaryKey(),
    siteKey:            varchar("site_key", { length: 64 }).notNull(),
    name:               varchar("name", { length: 255 }).notNull(),
    url:                varchar("url", { length: 512 }).notNull(),
    checkIntervalHours: int("check_interval_hours").notNull().default(168),
    isActive:           tinyint("is_active").notNull().default(1),
    lastCheckedAt:      datetime("last_checked_at", { fsp: 3 }),
    createdAt:          datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [uniqueIndex("uq_site_key").on(t.siteKey)],
);

export const hfCompetitorSnapshots = mysqlTable(
  "hf_competitor_snapshots",
  {
    id:                int("id").autoincrement().primaryKey(),
    siteKey:           varchar("site_key", { length: 64 }).notNull(),
    checkedAt:         datetime("checked_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    productCount:      int("product_count"),
    marketCount:       int("market_count"),
    detectedFeatures:  json("detected_features").$type<string[]>(),
    rawMetrics:        json("raw_metrics").$type<Record<string, unknown>>(),
    diffSummary:       text("diff_summary"),
    scrapeOk:          tinyint("scrape_ok").notNull().default(1),
    errorMsg:          varchar("error_msg", { length: 512 }),
  },
  (t) => [
    index("idx_site_key").on(t.siteKey),
    index("idx_checked_at").on(t.checkedAt),
  ],
);

// TCMB EVDS aylik enflasyon gostergeleri (TUFE, TUFE-gida, Yi-UFE)
export const hfInflationMonthly = mysqlTable(
  "hf_inflation_monthly",
  {
    id:            int("id").autoincrement().primaryKey(),
    periodYear:    int("period_year").notNull(),
    periodMonth:   int("period_month").notNull(),
    indicator:     varchar("indicator", { length: 64 }).notNull(),
    indexValue:    decimal("index_value", { precision: 12, scale: 4 }),
    yoyChangePct:  decimal("yoy_change_pct", { precision: 8, scale: 4 }),
    momChangePct:  decimal("mom_change_pct", { precision: 8, scale: 4 }),
    sourceApi:     varchar("source_api", { length: 64 }).notNull().default("tcmb_evds"),
    createdAt:     datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("uq_period_indicator").on(t.periodYear, t.periodMonth, t.indicator),
    index("idx_indicator_period").on(t.indicator, t.periodYear, t.periodMonth),
  ],
);

// Pro Tier API anahtarlari (X-API-Key header ile gelen istekler tier bazli rate-limit alir)
export const hfApiKeys = mysqlTable(
  "hf_api_keys",
  {
    id:                int("id").autoincrement().primaryKey(),
    userId:            varchar("user_id", { length: 36 }).notNull(),
    keyHash:           varchar("key_hash", { length: 64 }).notNull(),
    keyPrefix:         varchar("key_prefix", { length: 16 }).notNull(),
    name:              varchar("name", { length: 128 }).notNull().default("My API Key"),
    tier:              mysqlEnum("tier", ["free", "pro"]).notNull().default("free"),
    dailyLimit:        int("daily_limit").notNull().default(100),
    usedToday:         int("used_today").notNull().default(0),
    usageWindowStart:  date("usage_window_start", { mode: "string" }).notNull(),
    lastUsedAt:        datetime("last_used_at", { fsp: 3 }),
    revokedAt:         datetime("revoked_at", { fsp: 3 }),
    createdAt:         datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("uq_key_hash").on(t.keyHash),
    index("idx_user_id").on(t.userId),
    index("idx_tier_revoked").on(t.tier, t.revokedAt),
  ],
);

export const hfRedirects = mysqlTable(
  "hf_redirects",
  {
    id:          int("id").autoincrement().primaryKey(),
    sourcePath:  varchar("source_path", { length: 512 }).notNull(),
    type:        mysqlEnum("type", ["301", "410"]).notNull().default("301"),
    targetUrl:   varchar("target_url", { length: 512 }),
    note:        varchar("note", { length: 255 }),
    hits:        int("hits").notNull().default(0),
    lastHitAt:   datetime("last_hit_at", { fsp: 3 }),
    isActive:    tinyint("is_active").notNull().default(1),
    createdAt:   datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:   datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("hf_redirects_source_uq").on(t.sourcePath),
    index("hf_redirects_active_idx").on(t.isActive, t.type),
  ],
);

export const hfBanners = mysqlTable(
  "hf_banners",
  {
    id:           int("id").autoincrement().primaryKey(),
    position:     varchar("position", { length: 64 }).notNull(),
    title:        varchar("title", { length: 190 }).notNull(),
    advertiser:   varchar("advertiser", { length: 160 }),
    notes:        varchar("notes", { length: 500 }),
    type:         mysqlEnum("type", ["image", "code"]).notNull().default("image"),
    imageUrl:     varchar("image_url", { length: 512 }),
    alt:          varchar("alt", { length: 255 }),
    linkUrl:      varchar("link_url", { length: 500 }),
    linkTarget:   varchar("link_target", { length: 20 }).notNull().default("_blank"),
    rel:          varchar("rel", { length: 64 }).notNull().default("sponsored nofollow noopener"),
    code:         text("code"),
    caption:      varchar("caption", { length: 300 }),
    ctaLabel:     varchar("cta_label", { length: 60 }),
    device:       mysqlEnum("device", ["all", "desktop", "mobile"]).notNull().default("all"),
    weight:       int("weight").notNull().default(1),
    displayOrder: int("display_order").notNull().default(0),
    isActive:     tinyint("is_active").notNull().default(0),
    startAt:      datetime("start_at", { fsp: 3 }),
    endAt:        datetime("end_at", { fsp: 3 }),
    impressions:  int("impressions").notNull().default(0),
    clicks:       int("clicks").notNull().default(0),
    createdAt:    datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt:    datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("hf_banners_pos_idx").on(t.position, t.isActive, t.displayOrder),
    index("hf_banners_active_idx").on(t.isActive),
  ],
);
