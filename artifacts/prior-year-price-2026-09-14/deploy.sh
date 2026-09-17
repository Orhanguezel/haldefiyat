#!/usr/bin/env bash
set -euo pipefail
exec 9>/tmp/hal-deploy.lock
flock -n 9
cd /var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari
release=.next-release-20260914ee01
test ! -e "frontend/$release"
old_target=$(readlink frontend/standalone-server.js)
mapfile -t files < <(tar -tf /tmp/hal-prior-year-price-20260914.tar)
mkdir -p /tmp/hal-prior-year-price-backup-20260914
for path in "${files[@]}"; do
  if test -f "$path"; then cp --parents "$path" /tmp/hal-prior-year-price-backup-20260914/; fi
done
printf '%s\n' "$old_target" > /tmp/hal-prior-year-price-backup-20260914/old-target.txt
tar -xf /tmp/hal-prior-year-price-20260914.tar
pm2 reload hal-backend
for i in $(seq 1 45); do
 if curl -fsS --max-time 3 http://127.0.0.1:8091/api/health >/dev/null 2>&1; then break; fi
 sleep 1
done
curl -fsS --max-time 5 http://127.0.0.1:8091/api/health >/dev/null
restore_link() { ln -sfn "$old_target" frontend/standalone-server.js; }
trap restore_link ERR
(cd frontend && NEXT_DIST_DIR="$release" NODE_OPTIONS=--max-old-space-size=3072 bun run build) > /tmp/hal-prior-year-price-build.log 2>&1
# Build script prepares the release symlink; existing workers keep serving the old release.
test -f frontend/standalone-server.js
mapfile -t workers < <(pm2 jlist | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>JSON.parse(s).filter(p=>p.name==="hal-frontend").forEach(p=>console.log(p.pm_id)))')
test "${#workers[@]}" -ge 2
for worker in "${workers[@]}"; do
  pm2 reload "$worker" --update-env
  curl --fail --silent --show-error --retry 4 --retry-delay 2 --max-time 20 http://127.0.0.1:3033/.well-known/security.txt >/dev/null
done
trap - ERR
printf 'RELEASE=%s\nPREVIOUS=%s\n' "$release" "$old_target"
