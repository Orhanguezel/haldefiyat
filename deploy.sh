#!/usr/bin/env bash
# deploy.sh — VPS deploy scripti
# Kullanım:
#   bash deploy.sh           → git pull + build + PM2 reload (DB'ye dokunmaz)
#   bash deploy.sh --seed    → yukarıdakiler + db:seed (DROP öncesi otomatik backup alır)
set -euo pipefail

# ── Tek dagitim kilidi ──────────────────────────────────────────────────────
# Codex ve Claude ayni repoda paralel calisiyor; 2026-09-01'de iki dagitim
# cakisti: once baslayan dagitimin "eski release dizinleri temizleniyor" adimi,
# sonra baslayanin HALA YAZILMAKTA OLAN .next-release-<sha> dizinini sildi ve
# build `ENOENT ... _buildManifest.js.tmp` ile dustu. Kilit, ikinci dagitimin
# yarismasi yerine beklemesini saglar.
exec 9>"/tmp/hal-deploy.lock"
if ! flock -w 1200 9; then
  echo "HATA: baska bir deploy 20 dakikadir devam ediyor, kilit alinamadi" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$REPO_ROOT/frontend"
BACKEND="$REPO_ROOT/backend"
ADMIN="$REPO_ROOT/admin_panel"
LOGS="$REPO_ROOT/logs"

# Build bellek tavanlari (2026-08-31, A3/S6).
# Kutu 7,9 GB RAM + 8 GB swap; deploy aninda tipik bos alan ~3 GB. Admin
# (Turbopack) build'i 2,2 GB'a kadar cikip iki kez OOM'landi, ikincisinde pm2
# daemon'i da dusurdu (~30 sn 502). Tavan koyunca V8 daha agresif GC yapar;
# gercekten yetmezse build TEMIZ hata verir — kutuyu dusurmek yerine.
# Admin daha dar: admin build'inin dusmesi tolere edilebilir, frontend'inki degil.
FRONTEND_BUILD_MEM="${FRONTEND_BUILD_MEM:-3072}"
ADMIN_BUILD_MEM="${ADMIN_BUILD_MEM:-2048}"

# Dagitim penceresini olcmek icin log satir ofseti (tarih karsilastirmasi ay
# sinirinda sozluksel olarak bozulur: "01/Sep" < "30/Aug"). Ofset her zaman dogru.
ACCESS_LOG="/var/log/nginx/haldefiyat.access.log"
DEPLOY_LOG_OFFSET="$( [ -r "$ACCESS_LOG" ] && wc -l < "$ACCESS_LOG" || echo 0 )"

echo "==> [1/6] git pull (fast-forward only)"
cd "$REPO_ROOT"
# Release build'i `next-env.d.ts` ve `tsconfig.json`'i KENDISI yeniden yaziyor:
# NEXT_DIST_DIR her deploy'da degistigi icin Next her seferinde tsconfig
# include'una bir `.next-release-<sha>/types/**` satiri EKLIYOR ve hic
# silmiyordu (VPS'te 300+ satir birikmisti). Ikisi de uretilmis dosya; pull'u
# bloke etmesinler diye once atilir. Gercek config degisikligi commit'ten gelir.
git checkout -- \
  frontend/next-env.d.ts frontend/tsconfig.json \
  admin_panel/next-env.d.ts admin_panel/tsconfig.json 2>/dev/null || true
git pull --ff-only origin main

RELEASE_SHA="$(git rev-parse --short=12 HEAD)"
RELEASE_DIST=".next-release-$RELEASE_SHA"

echo "==> [2/6] backend production build"
if ! (cd "$BACKEND" && bun run build > "/tmp/hal-backend-build-$RELEASE_SHA.log" 2>&1); then
  tail -80 "/tmp/hal-backend-build-$RELEASE_SHA.log"
  echo "HATA: backend build başarısız!" && exit 1
fi
tail -25 "/tmp/hal-backend-build-$RELEASE_SHA.log"

echo "==> [3/6] frontend izole production build ($RELEASE_DIST)"
if ! (cd "$FRONTEND" && NEXT_DIST_DIR="$RELEASE_DIST" NODE_OPTIONS="--max-old-space-size=$FRONTEND_BUILD_MEM" bun run build > "/tmp/hal-frontend-build-$RELEASE_SHA.log" 2>&1); then
  tail -80 "/tmp/hal-frontend-build-$RELEASE_SHA.log"
  echo "HATA: frontend build başarısız!" && exit 1
fi
tail -25 "/tmp/hal-frontend-build-$RELEASE_SHA.log"

echo "==> [4/6] frontend standalone server.js doğrulaması"
TARGET="$(find "$FRONTEND/$RELEASE_DIST/standalone" \( -path "*/node_modules/*" -o -path "*/.bun/*" \) -prune -o -name "server.js" -print -quit)"
if [ -z "$TARGET" ]; then
  echo "HATA: frontend server.js bulunamadı!" && exit 1
fi
echo "    symlink hedefi: $FRONTEND/standalone-server.js → $(readlink -f "$FRONTEND/standalone-server.js" 2>/dev/null || echo "$TARGET")"

echo "==> [5/6] admin panel izole production build ($RELEASE_DIST)"
if ! (cd "$ADMIN" && NEXT_DIST_DIR="$RELEASE_DIST" NODE_OPTIONS="--max-old-space-size=$ADMIN_BUILD_MEM" bun run build > "/tmp/hal-admin-build-$RELEASE_SHA.log" 2>&1); then
  tail -80 "/tmp/hal-admin-build-$RELEASE_SHA.log"
  echo "HATA: admin panel build başarısız!" && exit 1
fi
tail -25 "/tmp/hal-admin-build-$RELEASE_SHA.log"

ADMIN_TARGET="$(find "$ADMIN/$RELEASE_DIST/standalone" \( -path "*/node_modules/*" -o -path "*/.bun/*" \) -prune -o -name "server.js" -print -quit)"
if [ -z "$ADMIN_TARGET" ]; then
  echo "HATA: admin panel server.js bulunamadı!" && exit 1
fi
ADMIN_SERVER_DIR="$(dirname "$ADMIN_TARGET")"
echo "    admin server: $ADMIN_TARGET"

mkdir -p "$LOGS"

# @agro workspace symlink'lerini koru (bun install sonrası silinebilir)
if [ ! -L "$REPO_ROOT/node_modules/@agro/shared-types" ]; then
  mkdir -p "$REPO_ROOT/node_modules/@agro"
  ln -sfn "$REPO_ROOT/packages/shared-types" "$REPO_ROOT/node_modules/@agro/shared-types"
  ln -sfn "$REPO_ROOT/packages/shared-ui"    "$REPO_ROOT/node_modules/@agro/shared-ui"
  echo "    @agro symlink'leri yenilendi"
fi

# packages/shared-backend/node_modules icindeki bozuk relative symlink'leri onar.
# Bun bazen eski calisma dizinine gore relative path uretebilir.
BUN_STORE="$REPO_ROOT/node_modules/.bun"
SHARED_NM="$REPO_ROOT/packages/shared-backend/node_modules"
if [ -d "$SHARED_NM" ] && [ -d "$BUN_STORE" ]; then
  _fix_bun_symlink() {
    local link="$1"
    local target
    target=$(readlink "$link" 2>/dev/null) || return
    if [[ "$target" == */node_modules/.bun/* ]]; then
      local suffix="${target##*/node_modules/.bun/}"
      local abs="$BUN_STORE/$suffix"
      [ -e "$abs" ] && rm "$link" && ln -sfn "$abs" "$link"
    fi
  }
  for entry in "$SHARED_NM"/*; do
    if [ -L "$entry" ]; then
      _fix_bun_symlink "$entry"
    elif [ -d "$entry" ]; then
      for scoped in "$entry"/*; do
        [ -L "$scoped" ] && _fix_bun_symlink "$scoped"
      done
    fi
  done
  echo "    shared-backend symlink'leri kontrol edildi"
fi

# Frontend iki PM2 cluster worker ile rolling reload edilir. Eski `.next` dizinini
# overwrite eden tarihsel akisin aksine her deploy izole release dizini kullanir ve
# eski release'ler rollback icin korunur; bu nedenle eski worker kendi HTML/static
# ciftini servis ederken yeni worker hazir hale gelebilir.
echo "==> [6/6] PM2 yayın geçişi"
cd "$REPO_ROOT"
# Ecosystem DOSYASI ile reload: "pm2 reload hal-backend" kayitli tanimi tekrar
# kullanir ve ecosystem.config.cjs'teki degisiklikleri (ornegin kill_timeout)
# HIC okumaz — 1 Eylul 2026'da kill_timeout eklenmis ama uygulanmamisti.
# Admin zaten bu bicimde reload ediliyordu; backend ve frontend de oyle olsun.
pm2 reload "$REPO_ROOT/ecosystem.config.cjs" --only hal-backend --update-env \
  || pm2 start "$REPO_ROOT/ecosystem.config.cjs" --only hal-backend

# Backend reload'undan sonra saglik kapisi YOKTU; script hemen frontend'e geciyordu.
# Olculdu (1 Eylul 2026): backend fork modunda, reload = tam yeniden baslatma ve
# acilis 7 sn (bos kutu) ile 21 sn (bellek baskisi altinda) arasinda degisiyor —
# SIGINT ile dinlemeyi birakma anlik (0,4 sn), suren tamami modul yukleme.
# O pencerede frontend'i reload etmek belgeli bir vakaya yol acmisti: 31 Agustos
# 2026'da ~30 sn ECONNREFUSED sirasinda bir cluster worker'in fetch onbellegine
# BOS urun listesi yazildi, o worker'a dusen /urun/* istekleri 404 uretip ISR'ye
# kaydetti. Kapi, frontend'in olu backend'e acilmasini engeller.
echo "    backend health bekleniyor"
BACKEND_HEALTH_OK=0
for _attempt in $(seq 1 45); do
  if curl --fail --silent --max-time 3 http://127.0.0.1:8091/api/health >/dev/null 2>&1; then
    BACKEND_HEALTH_OK=1
    echo "    backend hazir ($_attempt sn)"
    break
  fi
  sleep 1
done
if [ "$BACKEND_HEALTH_OK" -ne 1 ]; then
  echo "HATA: backend reload sonrasi 45 sn icinde health kapisi gecmedi" >&2
  exit 1
fi

_frontend_worker_health() {
  local ok=0
  for _health_attempt in 1 2 3 4 5; do
    if curl --fail --silent --show-error --max-time 10 \
      http://127.0.0.1:3033/.well-known/security.txt >/dev/null; then
      ok=1
      break
    fi
    sleep 2
  done
  [ "$ok" -eq 1 ]
}

mapfile -t FRONTEND_WORKER_IDS < <(
  pm2 jlist | node -e '
    let raw = "";
    process.stdin.on("data", (chunk) => { raw += chunk; });
    process.stdin.on("end", () => {
      for (const proc of JSON.parse(raw)) {
        if (proc.name === "hal-frontend") console.log(proc.pm_id);
      }
    });
  '
)

if [ "${#FRONTEND_WORKER_IDS[@]}" -eq 0 ]; then
  pm2 start ecosystem.config.cjs --only hal-frontend
  _frontend_worker_health
elif [ "${#FRONTEND_WORKER_IDS[@]}" -lt 2 ]; then
  echo "HATA: hal-frontend cluster iki worker degil; kesintili otomatik gecis reddedildi" >&2
  exit 1
else
  # PM2'ye iki ID'yi tek reload komutunda vermek kisa soguk pencere yaratti.
  # Her worker'i ayri yenile ve digerine gecmeden once ortak portu dogrula.
  #
  # DIKKAT: ID ile reload ecosystem.config.cjs'i OKUMAZ. hal-frontend icin
  # ecosystem ayari degistirildiginde (kill_timeout, env, instances...) bir kez
  #   pm2 reload "$REPO_ROOT/ecosystem.config.cjs" --only hal-frontend --update-env && pm2 save
  # calistirilmalidir; PM2 bunu kendi rolling reload'uyla yapar.
  for worker_id in "${FRONTEND_WORKER_IDS[@]}"; do
    pm2 reload "$worker_id" --update-env
    _frontend_worker_health
  done
fi
# Admin panel ayrı ecosystem ile yönetiliyor
ADMIN_PANEL_APP_NAME=hal-admin \
ADMIN_PANEL_CWD="$ADMIN" \
ADMIN_PANEL_PORT=3036 \
ADMIN_PANEL_HOST=127.0.0.1 \
ADMIN_PANEL_OUT_LOG="$LOGS/hal-admin-out.log" \
ADMIN_PANEL_ERR_LOG="$LOGS/hal-admin-err.log" \
pm2 restart "$ADMIN/ecosystem.config.cjs" --only hal-admin --update-env \
  || ADMIN_PANEL_APP_NAME=hal-admin \
     ADMIN_PANEL_CWD="$ADMIN" \
     ADMIN_PANEL_PORT=3036 \
     ADMIN_PANEL_HOST=127.0.0.1 \
     ADMIN_PANEL_OUT_LOG="$LOGS/hal-admin-out.log" \
     ADMIN_PANEL_ERR_LOG="$LOGS/hal-admin-err.log" \
     pm2 start "$ADMIN/ecosystem.config.cjs"
pm2 save

FRONTEND_HEALTH_OK=0
for _attempt in 1 2 3 4 5; do
  if curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3033/ >/dev/null; then
    FRONTEND_HEALTH_OK=1
    break
  fi
  sleep 2
done
if [ "$FRONTEND_HEALTH_OK" -ne 1 ]; then
  echo "HATA: frontend rolling reload sonrasi health kapisi gecmedi" >&2
  exit 1
fi

# ── Onbellek isitma ─────────────────────────────────────────────────────────
# Her release YENI bir .next-release-<sha> dizini kullaniyor, yani Next'in fetch
# onbellegi her dagitimda SIFIRDAN basliyor. Olcum (2026-09-01, dagitimdan hemen
# sonra): /fiyatlar 3,3 sn ve /borsa 2,9 sn; isindiktan sonra ayni sayfalar
# 0,15-0,30 sn. Yani her dagitimdan sonra ilk ziyaretciler 10x yavas sayfa
# goruyor ve bu tam olarak CrUX'un p75 TTFB'sini besleyen kuyruk.
#
# Burada yalniz gezinti yuzeyleri isitiliyor; urun slug'lari sabit yazilmaz,
# API'den arama hacmine gore alinir. Adim dagitimi ASLA dusurmez.
echo "==> onbellek isitiliyor"
warm_urls() {
  local ua="$1"; shift
  for u in "$@"; do
    curl -s -o /dev/null --max-time 12 -H "Host: haldefiyat.com" -A "$ua" "http://127.0.0.1:3033$u" || true
  done
}
UA_DESKTOP="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
UA_MOBILE="Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36"
NAV_PATHS="/ /fiyatlar /borsa /ilanlar /analiz /hal /firmalar"
# Backend reload'dan hemen sonra calisiyor; ilk deneme bos donebiliyor
# (2026-09-01'de "0 urun sayfasi" ciktisi bu yuzdendi). Hatalar bastirilmaz —
# sessiz kalirsa adim calisiyor gorunup hicbir sey isitmez.
top_products() {
  curl -s --max-time 12 "http://127.0.0.1:8091/api/v1/prices/products?seoIndex=true" \
    | python3 -c 'import json,sys
d = json.load(sys.stdin)
items = d.get("items", d) if isinstance(d, dict) else d
items = [p for p in items if isinstance(p, dict) and p.get("slug")]
items.sort(key=lambda p: p.get("searchVolume") or 0, reverse=True)
print(" ".join("/urun/" + p["slug"] for p in items[:12]))'
}
TOP_PRODUCTS=""
for _try in 1 2 3; do
  TOP_PRODUCTS="$(top_products || true)"
  [ -n "$TOP_PRODUCTS" ] && break
  echo "    urun listesi bos, backend isiniyor olabilir — tekrar deneniyor ($_try/3)"
  sleep 3
done

# Iki pm2 cluster worker var; her URL iki kez cagriliyor ki ikisi de isinsin.
for _pass in 1 2; do
  # shellcheck disable=SC2086
  warm_urls "$UA_DESKTOP" $NAV_PATHS $TOP_PRODUCTS
done
warm_urls "$UA_MOBILE" "/"
warm_urls "$UA_MOBILE" "/"
echo "    isitildi: $(printf '%s' "$NAV_PATHS" | wc -w) gezinti + $(printf '%s' "$TOP_PRODUCTS" | wc -w) urun sayfasi"

# ── Eski release dizinlerini temizle ────────────────────────────────────────
# Calisan release + bir onceki (rollback icin) saklanir, gerisi silinir.
# Bu adim yoktu; 2026-08-24'te 146 bayat dizin ~28GB yer tutup diski %90'a
# cikarmis ve admin build'ini OOM ile dusurmustu.
echo "==> eski release dizinleri temizleniyor"
for app_dir in "$FRONTEND" "$ADMIN"; do
  live_dist="$(readlink -f "$app_dir/standalone-server.js" 2>/dev/null | grep -o '\.next-release-[a-f0-9]*' | head -1 || true)"
  removed=0
  for dist in "$app_dir"/.next-release-*; do
    [ -d "$dist" ] || continue
    base="$(basename "$dist")"
    [ "$base" = "$RELEASE_DIST" ] && continue
    [ -n "$live_dist" ] && [ "$base" = "$live_dist" ] && continue
    rm -rf "$dist"
    removed=$((removed + 1))
  done
  echo "    $(basename "$app_dir"): $removed eski dizin silindi"
done
df -h / | tail -1

# ── Dagitim penceresi 5xx sayaci (2026-08-31, A3/S6) ────────────────────────
# 19-30 Agustos olcumu: 463 sunucu hatasinin 456'si DORT dagitim gununde olustu,
# kalan sekiz gunde toplam 7. Regresyon sessiz kalmasin diye dagitimin kendi
# penceresindeki 5xx burada raporlanir.
if [ -r "$ACCESS_LOG" ]; then
  DEPLOY_5XX="$(tail -n "+$((DEPLOY_LOG_OFFSET + 1))" "$ACCESS_LOG" 2>/dev/null | awk -F'"' '
    { st = $3; gsub(/^ +/, "", st); split(st, a, " "); if (a[1] ~ /^5/) n++ }
    END { print n + 0 }' || echo "?")"
  echo ""
  echo "==> dagitim penceresi ($DEPLOY_LOG_OFFSET. satirdan sonra): 5xx = $DEPLOY_5XX"
  if [ "$DEPLOY_5XX" != "?" ] && [ "$DEPLOY_5XX" -gt 20 ] 2>/dev/null; then
    echo "    ⚠ 20 esigi asildi — kesinti yasandi, pm2 loglarina bak."
  fi
fi

echo ""
echo "✓ Deploy tamamlandı"
pm2 list

# ── Opsiyonel seed ───────────────────────────────────────────────────────────
if [[ "${1:-}" == "--seed" ]]; then
  echo ""
  echo "==> [opsiyonel] DB seed (DROP öncesi otomatik backup alınacak)..."
  cd "$REPO_ROOT/backend"
  ALLOW_DROP=true bun run db:seed
  echo "✓ Seed tamamlandı — backup: /tmp/hal-db-backups/"
fi
