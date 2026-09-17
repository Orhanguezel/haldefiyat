#!/usr/bin/env bash
set -euo pipefail
export PATH=/root/.bun/bin:$PATH
exec 9>/tmp/hal-deploy.lock
flock -n 9
cd /var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari
release=.next-release-20260915bf01
test ! -e "frontend/$release"
old_target=$(readlink frontend/standalone-server.js)
mapfile -t files < <(tar -tf /tmp/hal-ihracat-banner.tar)
mkdir -p /tmp/hal-ihracat-banner-backup-20260915
for path in "${files[@]}"; do
  if test -f "$path"; then cp --parents "$path" /tmp/hal-ihracat-banner-backup-20260915/; fi
done
printf '%s\n' "$old_target" > /tmp/hal-ihracat-banner-backup-20260915/old-target.txt
tar -xf /tmp/hal-ihracat-banner.tar
restore_link() { ln -sfn "$old_target" frontend/standalone-server.js; }
trap restore_link ERR
(cd frontend && NEXT_DIST_DIR="$release" NODE_OPTIONS=--max-old-space-size=3072 bun run build) > /tmp/hal-ihracat-banner-build.log 2>&1
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
