#!/usr/bin/env bash
# ETL Saglik Raporu — VPS'te (vps-vistainsaat) calistirilir.
#
# Usage:  ./scripts/etl-health.sh [WINDOW_HOURS]
#         (default 24h)
#
# Cikti:
#   1. Son N saat icinde her source'un durumu (last status, rows, duration)
#   2. Hata patterni olan source'lar (3+ ardisik error)
#   3. Veri akisi gormeyenler (son ok > N saat once)
#   4. Scrapling kanali kullanan source'lar (kalin yazi ile)
#
# CLAUDE.md'de proje kontrol talimati: bu scripti calistir, sonuca gore aksiyon al.

set -euo pipefail

WINDOW_HOURS="${1:-24}"

# DB credentials .env'den (VPS path)
ENV_FILE="/root/haldefiyat-src/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE bulunamadi. VPS'te misin?"
  exit 1
fi

DB_USER="$(grep -E '^DB_USER=' "$ENV_FILE" | cut -d= -f2)"
DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2)"
DB_NAME="$(grep -E '^DB_NAME=' "$ENV_FILE" | cut -d= -f2)"
SCRAPER_SOURCES="$(grep -E '^HF_SCRAPER_SOURCES=' "$ENV_FILE" | cut -d= -f2)"

echo "═══════════════════════════════════════════════════════════════════════"
echo "  ETL Saglik Raporu — son $WINDOW_HOURS saat"
echo "  Scrapling kullanilan source'lar: ${SCRAPER_SOURCES:-(yok)}"
echo "═══════════════════════════════════════════════════════════════════════"
echo

mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" --table -e "
-- 1. Source bazinda son durum
SELECT
  source_api,
  CASE WHEN source_api IN ($(echo "${SCRAPER_SOURCES:-none}" | sed "s/[^,]*/'&'/g")) THEN '🚀 SCRAPLING' ELSE 'legacy' END AS kanal,
  status,
  COUNT(*) AS run_sayisi,
  SUM(rows_inserted) AS toplam_satir,
  ROUND(AVG(duration_ms)) AS ortalama_ms,
  MAX(created_at) AS son_run,
  LEFT(MAX(error_msg), 80) AS son_hata
FROM hf_etl_runs
WHERE created_at >= NOW() - INTERVAL $WINDOW_HOURS HOUR
GROUP BY source_api, status
ORDER BY source_api, status;
" 2>&1 | grep -v "Using a password"

echo
echo "── Sorunlu Kaynaklar (son $WINDOW_HOURS saat icinde 3+ error, 0 ok) ──"
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" --table -e "
SELECT
  source_api,
  SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS hata_sayisi,
  SUM(CASE WHEN status='ok' THEN 1 ELSE 0 END) AS ok_sayisi,
  LEFT(MAX(CASE WHEN status='error' THEN error_msg END), 100) AS son_hata
FROM hf_etl_runs
WHERE created_at >= NOW() - INTERVAL $WINDOW_HOURS HOUR
GROUP BY source_api
HAVING hata_sayisi >= 3 AND ok_sayisi = 0
ORDER BY hata_sayisi DESC;
" 2>&1 | grep -v "Using a password"

echo
echo "── Veri Akisi Yok (son ok > 7 gun once) ──"
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" --table -e "
SELECT
  source_api,
  MAX(CASE WHEN status='ok' THEN created_at END) AS son_basarili,
  TIMESTAMPDIFF(HOUR, MAX(CASE WHEN status='ok' THEN created_at END), NOW()) AS saat_oncesinden,
  MAX(CASE WHEN status='error' THEN created_at END) AS son_error
FROM hf_etl_runs
GROUP BY source_api
HAVING son_basarili IS NULL OR son_basarili < NOW() - INTERVAL 7 DAY
ORDER BY son_basarili IS NULL DESC, son_basarili ASC;
" 2>&1 | grep -v "Using a password"

echo
echo "── scraper-service docker container ──"
docker ps --filter name=scraper-service --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "(scraper-service vps-vistainsaat'ta degil — vps-guezelwebdesign'da)"

echo
echo "Tam log: pm2 logs hal-backend --lines 100"
echo "Detay query: mysql ... 'SELECT ... FROM hf_etl_runs WHERE source_api=\"...\"'"
