#!/usr/bin/env bash
# VPS calisma agacindaki, origin/main ile BIREBIR AYNI olan drift'i kayipsiz temizler.
# Sadece icerigi origin/main ile ayni olan dosyalara dokunur; farkli olan hicbir
# dosyaya dokunmaz, sonunda geriye kalanlari listeler. Salt guvenli kisim budur.
# Calistirma: VPS'te repo kokunde  ->  bash ops/vps-drift-temizle.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch -q origin main

restored=0; removed=0; kept=()
while IFS= read -r f; do
  [ -n "$f" ] || continue
  vps=$(md5sum "$f" 2>/dev/null | cut -d' ' -f1 || true)
  ref=$(git show "origin/main:$f" 2>/dev/null | md5sum | cut -d' ' -f1 || true)
  if [ -n "$ref" ] && [ "$vps" = "$ref" ]; then
    if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
      git checkout -- "$f"; restored=$((restored+1))
    else
      rm -f "$f"; removed=$((removed+1))   # birebir ayni: pull ayni icerigi geri yazacak
    fi
  else
    kept+=("$f")
  fi
done < <(comm -12 <(git diff --name-only HEAD origin/main | sort) \
                  <(git status --porcelain | sed 's/^...//' | sort))

echo "geri alindi: $restored | silindi (pull geri yazacak): $removed"
echo "--- DOKUNULMADI (origin/main'den farkli, karar gerektirir) ---"
printf '%s\n' "${kept[@]:-<yok>}"
