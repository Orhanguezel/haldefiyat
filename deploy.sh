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

echo "==> [2/4] standalone server.js symlink kuruluyor"
# Next.js standalone server.js — build ortamına göre path değişir; find ile bul.
TARGET="$(find "$FRONTEND/.next/standalone" -name "server.js" | head -1)"
if [ -z "$TARGET" ]; then
  echo "HATA: server.js bulunamadı!" && exit 1
fi

ln -sf "$TARGET" "$FRONTEND/standalone-server.js"
echo "    symlink: $FRONTEND/standalone-server.js → $TARGET"

echo "==> [3/4] .next/static + public standalone'a kopyalanıyor"
# server.js'nin bulunduğu dizine göre static ve public kopyala.
SERVER_DIR="$(dirname "$TARGET")"
mkdir -p "$SERVER_DIR/.next/static"
cp -r "$FRONTEND/.next/static/." "$SERVER_DIR/.next/static/"
mkdir -p "$SERVER_DIR/public"
cp -r "$FRONTEND/public/." "$SERVER_DIR/public/"
echo "    static → $SERVER_DIR/.next/static"
echo "    public → $SERVER_DIR/public"

mkdir -p "$LOGS"

echo "==> [4/4] PM2 yeniden başlatılıyor"
cd "$REPO_ROOT"
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
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
