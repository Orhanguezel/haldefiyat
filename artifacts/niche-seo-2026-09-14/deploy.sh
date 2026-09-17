set -euo pipefail
exec 9>/tmp/hal-deploy.lock
flock -w 120 9
cd /var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari
stamp=niche-seo-20260914
mkdir -p /tmp/$stamp-backup
for f in backend/src/modules/redirects/repository.ts backend/src/modules/hal-admin/index.ts backend/dist/modules/redirects/repository.js backend/dist/modules/hal-admin/index.js; do
 mkdir -p "/tmp/$stamp-backup/$(dirname "$f")"
 cp "$f" "/tmp/$stamp-backup/$f"
done
tar -xf /tmp/niche-seo-release.tar
pm2 reload hal-backend
for i in $(seq 1 45); do
 if curl -fsS http://127.0.0.1:8091/api/v1/health >/dev/null; then
  echo 'Backend healthy'
  cd backend
  /root/.bun/bin/bun /tmp/niche-editorial-apply.ts
  exit 0
 fi
 sleep 1
done
exit 1
