set -euo pipefail
exec 9>/tmp/hal-deploy.lock
flock -w 120 9
cd /var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari
mkdir -p /tmp/quarantine-fix-20260915-backup
for f in backend/src/modules/etl/fetcher.ts backend/src/modules/prices/repository.ts backend/dist/modules/etl/fetcher.js backend/dist/modules/prices/repository.js; do
 cp --parents "$f" /tmp/quarantine-fix-20260915-backup/
done
tar -xf /tmp/quarantine-fix-20260915.tar
pm2 reload hal-backend
for i in $(seq 1 45); do
 if curl -fsS --max-time 3 http://127.0.0.1:8091/api/health >/dev/null 2>&1; then break; fi
 sleep 1
done
curl -fsS --max-time 3 http://127.0.0.1:8091/api/health >/dev/null
cd backend
/root/.bun/bin/bun /tmp/quarantine-repair.ts
/root/.bun/bin/bun /tmp/quarantine-rerun.ts
