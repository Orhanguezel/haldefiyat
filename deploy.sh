#!/usr/bin/env bash
# deploy.sh — VPS deploy scripti
# Kullanım:
#   bash deploy.sh           → git pull + build + PM2 reload (DB'ye dokunmaz)
#   bash deploy.sh --seed    → yukarıdakiler + db:seed (DROP öncesi otomatik backup alır)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$REPO_ROOT/frontend"
BACKEND="$REPO_ROOT/backend"
ADMIN="$REPO_ROOT/admin_panel"
LOGS="$REPO_ROOT/logs"

echo "==> [1/6] git pull (fast-forward only)"
cd "$REPO_ROOT"
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
if ! (cd "$FRONTEND" && NEXT_DIST_DIR="$RELEASE_DIST" bun run build > "/tmp/hal-frontend-build-$RELEASE_SHA.log" 2>&1); then
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
if ! (cd "$ADMIN" && NEXT_DIST_DIR="$RELEASE_DIST" bun run build > "/tmp/hal-admin-build-$RELEASE_SHA.log" 2>&1); then
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

# PM2: Next standalone icin RELOAD DEGIL RESTART.
#
# `pm2 reload` graceful-reload yapar; eski process ayakta kalir ve silinmis chunk'lara
# isaret eden ESKI HTML'i servis etmeye devam eder → /_next/static 500 / ChunkLoadError.
# 6 Temmuz 2026'da 33 adet statik 500 tam olarak bundan olustu. Kural CLAUDE.md'de
# yaziliydi ama script `reload` yapiyordu; insan hatasina birakmamak icin buraya sabitlendi.
echo "==> [6/6] PM2 yayın geçişi"
cd "$REPO_ROOT"
pm2 reload hal-backend --update-env || pm2 start ecosystem.config.cjs --only hal-backend
pm2 restart ecosystem.config.cjs --only hal-frontend --update-env || pm2 start ecosystem.config.cjs --only hal-frontend
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
