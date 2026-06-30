#!/usr/bin/env bash
# HalDeFiyat trafik raporu uretici.
# VPS nginx access-log'unu tarar, veri tablolari dolu bir markdown iskeleti
# (reports/analiz-<from>-<to>-<ay>-<yil>.md) uretir, istege bagli PDF basar.
# Trend + narrative bolumleri <!-- TODO --> birakilir (Claude doldurur).
#
# Kullanim:
#   ./traffic-report.sh --from 16 --to 23 [--month Jun] [--year 2026] [--pdf]
#
# Notlar:
#   - Tek ay icindeki gun araligini destekler (FROM..TO ayni ay).
#   - Tam gunleri sec (gunu bitmemis kismi gunu disla; ornek: dun'e kadar).
set -euo pipefail

HOST="${HF_TRAFFIC_HOST:-vps-vistainsaat}"
LOG_GLOB="${HF_TRAFFIC_LOG:-/var/log/nginx/haldefiyat.access.log*}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="$(cd "$SCRIPT_DIR/../../reports" && pwd)"

MON_ABBR="Jun"; YEAR="2026"; FROM=""; TO=""; MAKE_PDF=0
declare -A MON_TR=( [Jan]=Ocak [Feb]=Şubat [Mar]=Mart [Apr]=Nisan [May]=Mayıs [Jun]=Haziran [Jul]=Temmuz [Aug]=Ağustos [Sep]=Eylül [Oct]=Ekim [Nov]=Kasım [Dec]=Aralık )

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) FROM="$2"; shift 2;;
    --to) TO="$2"; shift 2;;
    --month) MON_ABBR="$2"; shift 2;;
    --year) YEAR="$2"; shift 2;;
    --pdf) MAKE_PDF=1; shift;;
    *) echo "Bilinmeyen arg: $1" >&2; exit 1;;
  esac
done
[[ -z "$FROM" || -z "$TO" ]] && { echo "Hata: --from ve --to zorunlu" >&2; exit 1; }

MONTH_TR="${MON_TR[$MON_ABBR]:-$MON_ABBR}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
SLUG_MON="$(echo "$MONTH_TR" | tr 'A-ZÇĞİÖŞÜ' 'a-zçğıöşü')"
OUT_MD="$REPORTS_DIR/analiz-$(printf '%02d' "$FROM")-$(printf '%02d' "$TO")-${SLUG_MON}-${YEAR}.md"

echo "→ VPS log taraniyor ($HOST): $MON_ABBR $FROM–$TO $YEAR"
ssh "$HOST" "cat > /tmp/traffic-report.awk" < "$SCRIPT_DIR/traffic-report.awk"
ssh "$HOST" "zcat -f $LOG_GLOB 2>/dev/null | awk -v MON=$MON_ABBR -v YEAR=$YEAR -v FROM=$FROM -v TO=$TO -f /tmp/traffic-report.awk" > "$TMP/result.txt"

echo "→ Markdown iskeleti uretiliyor: $OUT_MD"
python3 "$SCRIPT_DIR/traffic-report-format.py" "$TMP/result.txt" "$FROM" "$TO" "$MON_ABBR" "$YEAR" "$MONTH_TR" > "$OUT_MD"

if [[ "$MAKE_PDF" == "1" ]]; then
  OUT_PDF="${OUT_MD%.md}.pdf"
  echo "→ PDF basiliyor: $OUT_PDF"
  pandoc "$OUT_MD" -o "$OUT_PDF" --pdf-engine=weasyprint --css="$SCRIPT_DIR/traffic-report.css" \
    --metadata title="HalDeFiyat Trafik Analizi $FROM-$TO $MONTH_TR $YEAR" 2>/dev/null || \
    echo "  ⚠ PDF basilamadi (pandoc/weasyprint kurulu mu?)"
fi

echo "✓ Bitti. Trend + HATALAR/BULGULAR + Aksiyon bolumlerindeki <!-- TODO --> alanlari doldur."
