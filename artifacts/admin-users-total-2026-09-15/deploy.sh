#!/bin/bash
set -euo pipefail
exec 9>/tmp/hal-deploy.lock
flock -n 9
ROOT=/var/www/tarim-dijital-ekosistem
ADMIN=$ROOT/projects/hal-fiyatlari/admin_panel
mkdir -p /tmp/hal-users-backup-20260915
cd "$ROOT"
tar -tf /tmp/hal-users-fix.tar > /tmp/hal-users-files.txt
tar -cf /tmp/hal-users-backup-20260915/source.tar -T /tmp/hal-users-files.txt
readlink "$ADMIN/standalone-server.js" > /tmp/hal-users-backup-20260915/admin-link.txt
tar -xf /tmp/hal-users-fix.tar
cd "$ADMIN"
export PATH=/root/.bun/bin:$PATH
NEXT_DIST_DIR=.next-release-20260915ab01 NODE_OPTIONS=--max-old-space-size=3072 bun run build > /tmp/hal-users-admin-build.log 2>&1
pm2 reload hal-backend
ADMIN_PANEL_APP_NAME=hal-admin ADMIN_PANEL_CWD="$ADMIN" ADMIN_PANEL_PORT=3036 ADMIN_PANEL_HOST=127.0.0.1 pm2 restart "$ADMIN/ecosystem.config.cjs" --only hal-admin --update-env
for attempt in $(seq 1 20); do
 if curl -fsS http://127.0.0.1:8091/api/health >/dev/null && curl -fsS http://127.0.0.1:3036/admin/auth/login >/dev/null; then echo HEALTH_OK; exit 0; fi
 sleep 2
done
exit 1
