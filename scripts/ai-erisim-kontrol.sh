#!/usr/bin/env bash
# AI erisim regresyon kontrolu — robots.txt + llms.txt.
#
# NEDEN: 17 Eyl 2026 AI gorunurluk olcumunde dort urun sorgusunun dordunde de
# site kaynak olarak dondu ve kendi metodoloji paragrafimiz yanitlara birebir
# girdi. Bunun teknik sebebi tek sey: robots.txt'teki AI bot izinleri + llms.txt.
# Bu iki dosya bir deploy'da sessizce degisirse butun o kazanim geri alinir ve
# hicbir hata log'u dusmez — bu yuzden deploy sonunda acikca kontrol edilir.
#
# Hash degisimi HATA DEGIL uyaridir (icerik mesru sekilde guncellenir);
# kural kaybi ise hatadir.
set -u
BASE_URL="${1:-http://127.0.0.1:3033}"
BASELINE="$(cd "$(dirname "$0")/.." && pwd)/deploy/ai-erisim-temel.txt"
FAIL=0

say() { printf '%s\n' "$*"; }

robots="$(curl -s -m 20 "$BASE_URL/robots.txt" || true)"
llms="$(curl -s -m 20 "$BASE_URL/llms.txt" || true)"

if [ -z "$robots" ]; then say "    ✗ robots.txt BOS veya alinamadi"; FAIL=1; fi
if [ -z "$llms" ];   then say "    ✗ llms.txt BOS veya alinamadi";   FAIL=1; fi

# 1) AI botlari izinli mi
for bot in GPTBot ChatGPT-User ClaudeBot PerplexityBot Google-Extended CCBot; do
  if ! printf '%s' "$robots" | grep -qi "^User-Agent: *$bot"; then
    say "    ✗ robots.txt: $bot grubu YOK"; FAIL=1
  fi
done

# 2) Genel gruba tam yasak konmus mu (en yikici regresyon)
if printf '%s' "$robots" | awk '
  /^User-Agent: *\*/ { inall=1; next }
  /^User-Agent:/     { inall=0 }
  inall && /^Disallow: *\/ *$/ { found=1 }
  END { exit found ? 0 : 1 }'; then
  say "    ✗ robots.txt: User-Agent: * altinda 'Disallow: /' — SITE TAMAMEN KAPALI"; FAIL=1
fi

# 3) Salt-okunur API uclari AI botlarina acik mi
for path in /api/v1/prices /api/v1/index /api/docs/json; do
  printf '%s' "$robots" | grep -q "^Allow: $path" || { say "    ✗ robots.txt: 'Allow: $path' YOK"; FAIL=1; }
done

# 4) llms.txt govdesi
printf '%s' "$llms" | grep -q '^# ' || { say "    ✗ llms.txt: H1 basligi yok"; FAIL=1; }
printf '%s' "$llms" | grep -qi 'api' || { say "    ✗ llms.txt: API bolumu yok"; FAIL=1; }
llms_bytes=$(printf '%s' "$llms" | wc -c)
[ "$llms_bytes" -gt 1000 ] || { say "    ✗ llms.txt cok kisa ($llms_bytes bayt)"; FAIL=1; }

# 5) Degisiklik bildirimi (hata degil)
#
# llms.txt govdesinde CANLI SAYILAR var ("353 izlenen urun", "31 aktif hal",
# veri baslangic tarihi). Bunlar her ETL gunuyle ve her urun birlestirmesiyle
# degisir; ham hash her deploy'da uyari basar ve uyari degersizlesir. Parmak izi
# bu yuzden rakamlardan arindirilmis govdeden alinir: bolum basliklari ve URL'ler
# korunur (asil izlemek istedigimiz sey), sayac oynamalari gorunmez.
llms_iskelet="$(printf '%s' "$llms" | sed 's/[0-9]\{1,\}//g')"
now="robots=$(printf '%s' "$robots" | sha256sum | cut -c1-16) llms=$(printf '%s' "$llms_iskelet" | sha256sum | cut -c1-16)"
if [ -r "$BASELINE" ]; then
  prev="$(cat "$BASELINE")"
  if [ "$now" != "$prev" ]; then
    say "    ⚠ robots.txt/llms.txt DEGISTI — bilerek mi?"
    say "      onceki: $prev"
    say "      simdi : $now"
    say "      dogruysa: $BASELINE dosyasini guncelle"
  fi
else
  say "    ℹ temel parmak izi yok, olusturuluyor: $BASELINE"
  mkdir -p "$(dirname "$BASELINE")" && printf '%s\n' "$now" > "$BASELINE"
fi

if [ "$FAIL" -eq 0 ]; then say "    ✓ AI erisimi saglam (6 bot izinli, API uclari acik, llms.txt $llms_bytes bayt)"; fi
exit "$FAIL"
