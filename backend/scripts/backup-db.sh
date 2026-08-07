#!/usr/bin/env bash
set -euo pipefail

: "${DB_HOST:=127.0.0.1}"
: "${DB_PORT:=3306}"
: "${DB_USER:?DB_USER tanımlanmalı}"
: "${DB_PASSWORD:?DB_PASSWORD tanımlanmalı}"
: "${DB_NAME:?DB_NAME tanımlanmalı}"
: "${DB_BACKUP_DIR:=/var/backups/haldefiyat}"
: "${DB_BACKUP_RETENTION_DAYS:=30}"

mkdir -p "${DB_BACKUP_DIR}"
umask 077

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="${DB_BACKUP_DIR}/${DB_NAME}-${timestamp}.sql.gz"

MYSQL_PWD="${DB_PASSWORD}" mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  "${DB_NAME}" | gzip -9 > "${target}"

gzip -t "${target}"
find "${DB_BACKUP_DIR}" -maxdepth 1 -type f -name "${DB_NAME}-*.sql.gz" -mtime "+${DB_BACKUP_RETENTION_DAYS}" -delete

echo "${target}"
