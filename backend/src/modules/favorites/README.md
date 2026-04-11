# Favorites Module — SSO Pending

Bu modul P2 oncelikli: kullanici favori urun takibi. Su an `501 Not Implemented` dondurur.

## Gereksinim: DB tablosu

Aktif etmeden once `src/db/seed/sql/020_hal_domain_schema.sql` dosyasina asagidaki tablo eklenmelidir. **ALTER TABLE kesinlikle yasak** — tablo `CREATE TABLE` olarak seed dosyasina eklenir, ardindan `bun run db:seed:fresh` ile DB sifirdan olusturulur.

```sql
-- ─── Kullanici Favori Urunleri (P2 — SSO sonrasi) ─────────────────────────────
CREATE TABLE IF NOT EXISTS `hf_user_favorites` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`      INT UNSIGNED  NOT NULL,
  `product_slug` VARCHAR(128)  NOT NULL,
  `created_at`   DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_fav_user_product_uq` (`user_id`, `product_slug`),
  KEY `hf_fav_user_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Drizzle schema ekleme (sonraki adim)

`src/db/schema.ts` dosyasina eklenecek:

```ts
export const hfUserFavorites = mysqlTable("hf_user_favorites", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("user_id").notNull(),
  productSlug: varchar("product_slug", { length: 128 }).notNull(),
  createdAt:   datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
}, (t) => [
  uniqueIndex("hf_fav_user_product_uq").on(t.userId, t.productSlug),
  index("hf_fav_user_idx").on(t.userId),
]);
```

## Endpoint'ler (tablo hazir olduktan sonra)

| Method | Path                       | Auth | Notlar                                       |
|--------|----------------------------|------|----------------------------------------------|
| GET    | /api/v1/favorites          | JWT  | Kullanicinin tum favori urun slug'lari       |
| POST   | /api/v1/favorites          | JWT  | Body: { productSlug }                        |
| DELETE | /api/v1/favorites/:slug    | JWT  | Idempotent delete                            |

## SSO Bagimliligi

`requireAuth` middleware'i zaten `@agro/shared-backend/middleware/auth` uzerinden calisiyor. Hal Fiyatlari backend'inde SSO icin kullanilacak `users` tablosu ortak shared-backend paketinden gelecek (auth modulu). Tablo hazir oldugunda bu dosyayi silip `router.ts` icindeki 501 donusleri gercek CRUD ile degistirin.
