#!/usr/bin/env bash
# deploy.sh — VPS deploy scripti
# Kullanım:
#   bash deploy.sh           → git pull + build + PM2 reload (DB'ye dokunmaz)
#   bash deploy.sh --seed    → yukarıdakiler + db:seed (DROP öncesi otomatik backup alır)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$REPO_ROOT/frontend"
LOGS="$REPO_ROOT/logs"

echo "==> [1/4] git pull"
cd "$REPO_ROOT"
git pull origin main

# packages/shared-backend monorepo workspace'ine taşındı ama VPS'te backend
# @agro/shared-backend'i import etmeye devam ediyor. git pull / reset --hard
# bu dizini siler — VPS-yerel backup'tan restore edelim.
SHARED_BACKUP="/root/haldefiyat-shared/packages"
if [ -d "$SHARED_BACKUP/shared-backend/core" ]; then
  if [ ! -d "$REPO_ROOT/packages/shared-backend/core" ]; then
    echo "    packages/shared-backend eksik → $SHARED_BACKUP'tan kopyalanıyor"
    mkdir -p "$REPO_ROOT/packages"
    cp -ar "$SHARED_BACKUP/." "$REPO_ROOT/packages/"
  fi
else
  echo "    uyari: $SHARED_BACKUP yok — ilk kurulum lazim (cp -ar packages /root/haldefiyat-shared/)"
fi

echo "==> [2/5] standalone server.js symlink kuruluyor (frontend)"
# Next.js standalone server.js — build ortamına göre path değişir; find ile bul.
TARGET="$(find "$FRONTEND/.next/standalone" -name "server.js" | head -1)"
if [ -z "$TARGET" ]; then
  echo "HATA: frontend server.js bulunamadı!" && exit 1
fi
ln -sf "$TARGET" "$FRONTEND/standalone-server.js"
echo "    symlink: $FRONTEND/standalone-server.js → $TARGET"

echo "==> [3/5] .next/static + public standalone'a kopyalanıyor (frontend)"
SERVER_DIR="$(dirname "$TARGET")"
mkdir -p "$SERVER_DIR/.next/static"
cp -r "$FRONTEND/.next/static/." "$SERVER_DIR/.next/static/"
mkdir -p "$SERVER_DIR/public"
cp -r "$FRONTEND/public/." "$SERVER_DIR/public/"
echo "    static → $SERVER_DIR/.next/static"
echo "    public → $SERVER_DIR/public"

echo "==> [4/5] admin panel standalone kurulumu"
ADMIN="$REPO_ROOT/admin_panel"
ADMIN_TARGET="$(find "$ADMIN/.next/standalone" -name "server.js" | head -1)"
if [ -n "$ADMIN_TARGET" ]; then
  ln -sf "$ADMIN_TARGET" "$ADMIN/standalone-server.js"
  ADMIN_SERVER_DIR="$(dirname "$ADMIN_TARGET")"
  mkdir -p "$ADMIN_SERVER_DIR/.next/static"
  cp -r "$ADMIN/.next/static/." "$ADMIN_SERVER_DIR/.next/static/"
  mkdir -p "$ADMIN_SERVER_DIR/public"
  cp -r "$ADMIN/public/." "$ADMIN_SERVER_DIR/public/" 2>/dev/null || true
  echo "    admin symlink: $ADMIN/standalone-server.js → $ADMIN_TARGET"
else
  echo "    uyari: admin panel .next/standalone yok — ilk kurulumda 'cd admin_panel && bun run build' çalıştır"
fi

mkdir -p "$LOGS"

# @agro workspace symlink'lerini koru (bun install sonrası silinebilir)
if [ ! -L "$REPO_ROOT/node_modules/@agro/shared-types" ]; then
  mkdir -p "$REPO_ROOT/node_modules/@agro"
  ln -sfn "$REPO_ROOT/packages/shared-types" "$REPO_ROOT/node_modules/@agro/shared-types"
  ln -sfn "$REPO_ROOT/packages/shared-ui"    "$REPO_ROOT/node_modules/@agro/shared-ui"
  echo "    @agro symlink'leri yenilendi"
fi

echo "==> [5/5] PM2 yeniden başlatılıyor"
cd "$REPO_ROOT"
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
# Admin panel ayrı ecosystem ile yönetiliyor
ADMIN_PANEL_APP_NAME=hal-admin \
ADMIN_PANEL_CWD="$ADMIN/.next/standalone/admin_panel" \
ADMIN_PANEL_PORT=3036 \
ADMIN_PANEL_HOST=127.0.0.1 \
ADMIN_PANEL_OUT_LOG="$LOGS/hal-admin-out.log" \
ADMIN_PANEL_ERR_LOG="$LOGS/hal-admin-err.log" \
pm2 reload "$ADMIN/ecosystem.config.cjs" --only hal-admin \
  || ADMIN_PANEL_APP_NAME=hal-admin \
     ADMIN_PANEL_CWD="$ADMIN/.next/standalone/admin_panel" \
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
  echo "==> [5/5] DB seed (DROP öncesi otomatik backup alınacak)..."
  cd "$REPO_ROOT/backend"
  ALLOW_DROP=true bun run db:seed
  echo "✓ Seed tamamlandı — backup: /tmp/hal-db-backups/"
fi
