#!/usr/bin/env bash
# Kanonik bag denetimi — VPS'te (vps-vistainsaat) calistirilir.
#
# Usage:  ./scripts/kanonik-denetim.sh [SAPMA_KATI] [MIN_SATIR]
#         (varsayilan 1.8 kat, 40 satir)
#
# NE SORAR: `canonical_slug` ile birbirine baglanmis iki kayit gercekten AYNI
# urun mu? Kanonik bag iki sey birden yapar — /urun/<dublike> adresini hedefe
# 301'ler VE dublikenin fiyat satirlarini hedefin ortalamasina katar. Yanlis
# kurulmus bir bag bu yuzden iki kez zarar verir: okuru alakasiz bir fiyata
# goturur ve hedefin ortalamasini kirletir.
#
# TESPIT: ayni birimdeki iki kaydin 90 gunluk ortalamasi birbirinden belirgin
# ayriliyorsa bunlar muhtemelen ayni urun DEGILDIR. Gercek ornekler (17 Eyl 2026):
#   kekik-25-gr → kekik            165,00 / 34,11  = 4,8 kat  (25 gramlik paket)
#   biber-sili  → biber-carliston  117,70 / 48,84  = 2,4 kat  (ayri biber)
#   kabak-bal   → kabak             64,53 / 34,27  = 1,9 kat  (bal kabagi ≠ kabak)
#
# BU BIR HUKUM DEGIL, KUYRUKTUR. Fiyat farki tek basina kanit sayilmaz — ayni
# urun farkli hallerde farkli fiyatlanabilir. Cikan her satir ELLE karara baglanir:
#   - gercekten ayri urun  → canonical_slug bosaltilir (gerekiyorsa family_slug)
#   - ayni urun, fiyat farki hal dagiliminden → dokunma
#   - ayni urun, iki kayit → admin absorb ucu ile yut
set -uo pipefail

KAT="${1:-1.8}"
MIN_SATIR="${2:-40}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${HALDEFIYAT_ENV_FILE:-$(cd "$SCRIPT_DIR/.." && pwd)/.env}"
if [ ! -f "$ENV_FILE" ]; then
  echo "HATA: $ENV_FILE bulunamadi. VPS'te misin?"
  exit 1
fi
DB_USER="$(grep -E '^DB_USER=' "$ENV_FILE" | cut -d= -f2)"
DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2)"
DB_NAME="$(grep -E '^DB_NAME=' "$ENV_FILE" | cut -d= -f2)"

echo "═══════════════════════════════════════════════════════════════════════"
echo "  Kanonik bag denetimi — sapma esigi ${KAT}x, en az ${MIN_SATIR} satir"
echo "═══════════════════════════════════════════════════════════════════════"
echo
echo "▸ 1. FIYATI HEDEFTEN AYRISAN KANONIK BAGLAR (ayri urun olabilir)"
echo "     Ortalamalar PUBLIC sorgunun gordugu satirlardan alinir: h.unit = p.unit."
echo "     Satir birimi urun birimiyle uyusmayan kayitlar zaten hicbir yerde"
echo "     gosterilmiyor; onlari katmak yanlis alarm uretiyordu (muz vakasi: ham"
echo "     ortalama 197 TL/kg, koli satirlari haric gercek deger 54)."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" --table -e "
SELECT d.slug AS dublike, s.slug AS hedef, d.unit AS birim,
       ROUND(AVG(hd.avg_price),2) AS dublike_ort,
       ROUND(ss.ort,2)            AS hedef_ort,
       ROUND(AVG(hd.avg_price)/ss.ort,2) AS kat,
       COUNT(*) AS satir
FROM hf_products d
JOIN hf_products s ON s.slug = d.canonical_slug AND s.is_active = 1
JOIN hf_price_history hd ON hd.product_id = d.id
     AND hd.recorded_date >= CURDATE() - INTERVAL 90 DAY AND hd.avg_price > 0
     AND hd.unit = d.unit
JOIN (SELECT p.id, AVG(h.avg_price) AS ort
        FROM hf_products p
        JOIN hf_price_history h ON h.product_id = p.id
             AND h.recorded_date >= CURDATE() - INTERVAL 90 DAY AND h.avg_price > 0
             AND h.unit = p.unit
       GROUP BY p.id) ss ON ss.id = s.id
WHERE d.is_active = 1 AND d.canonical_slug IS NOT NULL AND d.unit = s.unit
  -- Torba kayitlar zaten mansaet ortalamadan dislaniyor (residual-products.ts);
  -- burada listelenmeleri cozulmus sorunu tekrar raporlamak olurdu.
  AND d.slug NOT REGEXP '(^|-)(muhtelif|diger)(-|\$)'
GROUP BY d.slug, s.slug, d.unit, ss.ort
HAVING satir >= ${MIN_SATIR}
   AND (AVG(hd.avg_price)/ss.ort >= ${KAT} OR AVG(hd.avg_price)/ss.ort <= 1/${KAT})
ORDER BY kat DESC;" 2>/dev/null | grep -v "Using a password"

echo
echo "▸ 2. YUTULMAYI BEKLEYEN DUBLIKELER (ayni gun/ayni hal cakismasi YOK)"
echo "     Kanonik bag URL'i yonlendiriyor ama iki kayit da ayri duruyor."
echo "     NOT: 'muhtelif/diger' TORBA kayitlari bilerek bu listede DEGIL —"
echo "     onlar yutulursa satirlar ana kayda gecer ve bir daha ayirt edilemez,"
echo "     yani mansaet ortalamadan dislama kurali sessizce devre disi kalir."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" --table -e "
SELECT d.slug AS dublike, s.slug AS hedef, d.unit AS birim,
       (SELECT COUNT(*) FROM hf_price_history h WHERE h.product_id = d.id) AS satir,
       (SELECT MAX(h.recorded_date) FROM hf_price_history h WHERE h.product_id = d.id) AS son_kayit,
       (SELECT COUNT(*) FROM hf_price_history a
          JOIN hf_price_history b ON b.market_id = a.market_id
           AND b.recorded_date = a.recorded_date AND b.product_id = s.id
         WHERE a.product_id = d.id) AS cakisma
FROM hf_products d
JOIN hf_products s ON s.slug = d.canonical_slug AND s.is_active = 1
WHERE d.is_active = 1 AND d.canonical_slug IS NOT NULL AND d.unit = s.unit
  AND d.slug NOT REGEXP '(^|-)(muhtelif|diger)(-|\$)'
HAVING satir >= 500 AND cakisma = 0
ORDER BY satir DESC
LIMIT 30;" 2>/dev/null | grep -v "Using a password"

echo
echo "▸ 3. YUTULMUS AMA YONLENDIRMESI OLMAYAN SLUGLAR (404 veriyorlar)"
echo "     Kayit pasiflesince /urun/<slug> 404 olur — kanonik yonlendirmeyi ureten"
echo "     proxy urunu AKTIF listede arar ve pasif kaydi bulamaz. Cozum hf_redirects."
MISSING=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "
SELECT COUNT(*) FROM hf_products d
JOIN hf_products s ON s.slug = d.canonical_slug AND s.is_active = 1
WHERE d.is_active = 0 AND d.canonical_slug IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM hf_redirects r
                   WHERE r.source_path = CONCAT('/urun/', d.slug) AND r.is_active = 1);" 2>/dev/null)
if [ "${MISSING:-0}" -eq 0 ]; then
  echo "     ✓ yok — yutulan her slug yonlendiriliyor"
else
  echo "     ✗ $MISSING slug yonlendirmesiz:"
  mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" --table -e "
  SELECT d.slug AS olu_slug, d.canonical_slug AS gitmesi_gereken
  FROM hf_products d
  JOIN hf_products s ON s.slug = d.canonical_slug AND s.is_active = 1
  WHERE d.is_active = 0 AND d.canonical_slug IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM hf_redirects r
                     WHERE r.source_path = CONCAT('/urun/', d.slug) AND r.is_active = 1);" 2>/dev/null | grep -v "Using a password"
  echo "     Duzeltme: POST /api/v1/admin/redirects  {\"items\":[{\"sourcePath\":\"/urun/<olu>\",\"type\":\"301\",\"targetUrl\":\"/urun/<hedef>\"}]}"
fi

echo
echo "▸ 4. GORUNMEYEN SATIRLAR (satir birimi urun birimiyle uyusmuyor)"
echo "     publicUnitIntegrity (h.unit = p.unit) bu satirlari HER public sorgudan"
echo "     eler. Kural dogru — koli fiyatinin kg ortalamasina karismasini onler —"
echo "     ama satir yanlis URUNDE oldugu icin veri toplanip hicbir yerde"
echo "     gosterilmiyor. Sessiz kayip: hicbir hata log'u dusmez."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" --table -e "
SELECT p.slug AS urun, p.unit AS urun_birimi, h.unit AS satir_birimi,
       COUNT(*) AS gorunmeyen, ROUND(AVG(h.avg_price),2) AS ort,
       COALESCE(p.family_slug, p.canonical_slug, '-') AS aile
FROM hf_price_history h
JOIN hf_products p ON p.id = h.product_id AND p.is_active = 1
WHERE h.unit <> p.unit
  AND h.recorded_date >= CURDATE() - INTERVAL 90 DAY
  AND h.avg_price > 0
GROUP BY p.id, p.slug, p.unit, h.unit
ORDER BY gorunmeyen DESC
LIMIT 20;" 2>/dev/null | grep -v "Using a password"
TOPLAM=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "
SELECT COUNT(*) FROM hf_price_history h
JOIN hf_products p ON p.id = h.product_id AND p.is_active = 1
WHERE h.unit <> p.unit;" 2>/dev/null)
echo "     Tum zamanlar toplami: ${TOPLAM:-?} satir"
echo "     Iki ayri sinif — karistirma:"
echo "       (a) Hedefi olan: koli fiyati kg kaydinda duruyor ve ailede bir koli"
echo "           kaydi VAR → satirlar oraya tasinir (kazanc)."
echo "       (b) Hedefi olmayan: hal urunu farkli birimde yayinliyor ve o birimde"
echo "           kayit yok (roka demet/kg) → yeni kayit mi, urun birimi mi yanlis,"
echo "           karar gerekir. Korlemesine ortalamaya katma."

echo
echo "Not: 1. bolum ELLE karara baglanir (fiyat farki tek basina kanit degildir)."
echo "     2. bolumde cakisma=0 olanlar admin absorb ucuyle guvenle yutulabilir."
echo "     3. bolum BOS OLMALI; dolduysa absorb sonrasi yonlendirme yazilmamis demektir."
