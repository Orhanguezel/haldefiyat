# Hal Fiyatlari

**Canlı:** [haldefiyat.com](https://haldefiyat.com)

Çiftçiye, tüccara ve sektör oyuncularına günlük hal ve piyasa fiyatı takibi sunan tarım veri platformu. Tarım Dijital Ekosistemi'nin merkezi fiyat veri servisi olarak diğer ekosistem projelerine REST API ile fiyat bilgisi sağlar.

## Canlı Erişim Notu

Canlı servis `vps-vistainsaat` sunucusundadır. SSH erişimi key ile yapılır: `ssh vps-vistainsaat`.

## Tech Stack

- **Backend:** Fastify 5 · TypeScript · Drizzle ORM · MySQL · Bun (port 8088)
- **Frontend:** Next.js · React · Tailwind CSS (port 3033)
- **DB:** `hal_fiyatlari` (MySQL 8), şema prefix: `hf_`
- **Ortak:** `@agro/shared-backend` (auth, site ayarları, newsletter admin vb.)

## Mimari

```
hal-fiyatlari/
├── backend/                # Fastify API (port 8088)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── prices/     # Fiyat listeleme ve trend
│   │   │   ├── markets/    # Hal/pazar bilgisi
│   │   │   └── alerts/     # Fiyat alarmları
│   │   ├── cron/           # Otomatik veri toplama
│   │   └── db/             # Schema, migrations, seed
└── frontend/               # Next.js kullanıcı arayüzü
```

## API

```
GET /api/v1/prices?product=domates&city=Antalya&range=7d
GET /api/v1/prices/trending
GET /api/v1/prices/products
GET /api/v1/markets
POST /api/v1/admin/hal/observations   # JWT — manuel fiyat girişi
GET  /api/docs                        # Swagger
```

## Geliştirme

```bash
# Root dizinden (tarim-dijital-ekosistem/)
bun install && bun run build:shared

# Backend
cd projects/hal-fiyatlari/backend
cp .env.example .env   # DB bilgilerini girin
bun run db:seed
bun run dev

# Frontend
cd projects/hal-fiyatlari/frontend && bun run dev
```

## Deploy (`vps-vistainsaat`)

```
Backend:   PM2 haldefiyat-backend  → bun dist/index.js (port 8088)
Frontend:  PM2 haldefiyat-frontend → next start (port 3033)
Nginx:     haldefiyat.com → /api/* → :8088 | / → :3033
DB:        hal_fiyatlari @ MySQL
```

## Kurallar

- `hf_` prefix ile tüm tablolar ayrışır
- Tarihler UTC saklanır, frontend'de `Europe/Istanbul` gösterilir
- Schema değişikliği → seed SQL'e ekle, `db:seed:fresh` ile yeniden kur
- `@agro/shared-backend` modülleri tekrarlanmaz
