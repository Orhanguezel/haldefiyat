#!/usr/bin/env bash
# deploy.sh — VPS deploy scripti
# Kullanım: bash deploy.sh
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
# Next.js standalone server.js local monorepo build'den geldiğinde deep path'te,
# VPS native build'de frontend/ altında olabilir — ikisini de dene.
SERVER_DEEP="$FRONTEND/.next/standalone/projects/hal-fiyatlari/frontend/server.js"
SERVER_FLAT="$FRONTEND/.next/standalone/frontend/server.js"
SERVER_ROOT="$FRONTEND/.next/standalone/server.js"

if [ -f "$SERVER_DEEP" ]; then
  TARGET="$SERVER_DEEP"
elif [ -f "$SERVER_FLAT" ]; then
  TARGET="$SERVER_FLAT"
elif [ -f "$SERVER_ROOT" ]; then
  TARGET="$SERVER_ROOT"
else
  echo "HATA: server.js bulunamadı!" && exit 1
fi

ln -sf "$TARGET" "$FRONTEND/standalone-server.js"
echo "    symlink: $FRONTEND/standalone-server.js → $TARGET"

echo "==> [3/4] .next/static + public standalone'a kopyalanıyor"
# Next.js standalone kendi static dosyalarını içermez — manuel kopyalanmalı
mkdir -p "$FRONTEND/.next/standalone/projects/hal-fiyatlari/frontend/.next/static"
cp -r "$FRONTEND/.next/static/." "$FRONTEND/.next/standalone/projects/hal-fiyatlari/frontend/.next/static/"
cp -r "$FRONTEND/.next/static/." "$FRONTEND/.next/standalone/frontend/.next/static/" 2>/dev/null || true
mkdir -p "$FRONTEND/.next/standalone/projects/hal-fiyatlari/frontend/public"
cp -r "$FRONTEND/public/." "$FRONTEND/.next/standalone/projects/hal-fiyatlari/frontend/public/" 2>/dev/null || true
cp -r "$FRONTEND/public/." "$FRONTEND/.next/standalone/public/" 2>/dev/null || true

mkdir -p "$LOGS"

echo "==> [4/4] PM2 yeniden başlatılıyor"
cd "$REPO_ROOT"
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "✓ Deploy tamamlandı"
pm2 list
