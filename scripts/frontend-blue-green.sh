#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
frontend="$repo_root/frontend"
logs="$repo_root/logs"
pm2="$repo_root/scripts/frontend-pm2.sh"
node_bin="${HAL_FRONTEND_NODE:-/opt/hal-runtime/node-v24.21.0-linux-x64/bin/node}"
upstream_file="${HAL_FRONTEND_NGINX_UPSTREAM:-/etc/nginx/snippets/haldefiyat-frontend-active.conf}"

blue_port=3033
green_port=3034

active_port() {
  local found=""
  if [ -r "$upstream_file" ]; then
    found="$(sed -nE 's/^[[:space:]]*server[[:space:]]+127\.0\.0\.1:(3033|3034);.*/\1/p' "$upstream_file" | head -1)"
  fi
  printf '%s\n' "${found:-$blue_port}"
}

slot_name() {
  case "$1" in
    "$blue_port") printf '%s\n' "hal-frontend-blue" ;;
    "$green_port") printf '%s\n' "hal-frontend-green" ;;
    *) echo "HATA: bilinmeyen frontend portu: $1" >&2; return 1 ;;
  esac
}

other_port() {
  if [ "$1" = "$blue_port" ]; then printf '%s\n' "$green_port"; else printf '%s\n' "$blue_port"; fi
}

health() {
  local port="$1"
  local attempt
  for attempt in $(seq 1 20); do
    if curl --fail --silent --show-error --max-time 10 \
      -H "Host: haldefiyat.com" "http://127.0.0.1:${port}/.well-known/security.txt" >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

start_slot() {
  local name="$1" port="$2" target="$3"
  if [ ! -f "$target" ]; then
    echo "HATA: standalone server bulunamadi: $target" >&2
    return 1
  fi
  mkdir -p "$logs"
  NODE_ENV=production \
  PORT="$port" \
  HOSTNAME=0.0.0.0 \
  BACKEND_URL=http://127.0.0.1:8091 \
  TARIMIKLIM_API_URL=http://127.0.0.1:8088 \
    bash "$pm2" start "$target" \
      --name "$name" \
      --cwd "$(dirname "$target")" \
      --interpreter "$node_bin" \
      --output "$logs/${name}-out.log" \
      --error "$logs/${name}-error.log" \
      --time \
      --restart-delay 3000 \
      --kill-timeout 10000 \
      --max-memory-restart 700M
}

delete_slot() {
  local name="$1"
  bash "$pm2" delete "$name" >/dev/null 2>&1 || true
}

switch_upstream() {
  local port="$1"
  local tmp backup
  tmp="$(mktemp /etc/nginx/snippets/haldefiyat-frontend-active.XXXXXX)"
  backup="$(mktemp /etc/nginx/snippets/haldefiyat-frontend-rollback.XXXXXX)"
  if [ -f "$upstream_file" ]; then cp "$upstream_file" "$backup"; else : > "$backup"; fi
  printf 'upstream haldefiyat_frontend {\n    server 127.0.0.1:%s;\n    keepalive 8;\n}\n' "$port" > "$tmp"
  chmod 0644 "$tmp"
  mv "$tmp" "$upstream_file"
  if ! nginx -t; then
    cp "$backup" "$upstream_file"
    rm -f "$backup"
    echo "HATA: nginx yapilandirmasi gecersiz; onceki upstream geri kondu" >&2
    return 1
  fi
  systemctl reload nginx
  rm -f "$backup"
}

warm_candidate() {
  local port="$1" path
  for path in / /fiyatlar /borsa /ilanlar /analiz /hal /firmalar; do
    curl --silent --show-error --max-time 15 -H "Host: haldefiyat.com" \
      "http://127.0.0.1:${port}${path}" >/dev/null || true
  done
}

verify_nginx() {
  local attempt
  for attempt in $(seq 1 10); do
    if curl --fail --silent --show-error --max-time 15 \
      --resolve haldefiyat.com:443:127.0.0.1 \
      https://haldefiyat.com/ >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

deploy() {
  local target="$1"
  target="$(readlink -f "$target")"
  case "$target" in
    "$frontend"/.next-release-*/standalone/*/server.js|"$frontend"/.next/standalone/*/server.js) ;;
    *) echo "HATA: guvenli olmayan frontend target: $target" >&2; return 1 ;;
  esac

  exec 8>/tmp/hal-frontend-blue-green.lock
  flock -w 300 8 || { echo "HATA: frontend blue-green kilidi alinamadi" >&2; return 1; }

  local old_port candidate_port candidate_name old_slot old_json old_name old_target
  old_port="$(active_port)"
  candidate_port="$(other_port "$old_port")"
  candidate_name="$(slot_name "$candidate_port")"
  old_slot="$(slot_name "$old_port")"
  old_json="$(bash "$pm2" jlist)"
  old_name="$(printf '%s' "$old_json" | jq -r --arg port "$old_port" \
    '.[] | select(((.pm2_env.PORT // .pm2_env.env.PORT // "") | tostring) == $port) | .name' | head -1)"
  old_target="$(printf '%s' "$old_json" | jq -r --arg port "$old_port" \
    '.[] | select(((.pm2_env.PORT // .pm2_env.env.PORT // "") | tostring) == $port) | .pm2_env.pm_exec_path' | head -1)"

  echo "    aktif: ${old_name:-bilinmiyor} port=$old_port"
  echo "    aday: $candidate_name port=$candidate_port target=$target"

  delete_slot "$candidate_name"
  start_slot "$candidate_name" "$candidate_port" "$target"
  if ! health "$candidate_port"; then
    delete_slot "$candidate_name"
    echo "HATA: aday frontend saglik kontrolunu gecemedi; trafik $old_port portunda kaldi" >&2
    return 1
  fi
  warm_candidate "$candidate_port"

  switch_upstream "$candidate_port"
  if ! verify_nginx; then
    echo "HATA: nginx sonrasi dis saglik kontrolu gecmedi; $old_port portuna geri donuluyor" >&2
    switch_upstream "$old_port" || true
    delete_slot "$candidate_name"
    return 1
  fi

  # Ilk geciste eski surec `hal-frontend` adini tasiyabilir. Trafik yeni slota
  # gectikten sonra onu standart blue/green adina kesintisiz olarak tasiriz.
  if [ -n "$old_name" ] && [ "$old_name" != "$old_slot" ] && [ -f "$old_target" ]; then
    bash "$pm2" delete "$old_name" >/dev/null 2>&1 || true
    delete_slot "$old_slot"
    start_slot "$old_slot" "$old_port" "$old_target"
    if ! health "$old_port"; then
      echo "UYARI: aktif trafik saglam, fakat rollback slotu $old_slot hazirlanamadi" >&2
    fi
  fi

  bash "$pm2" save
  echo "    trafik $candidate_name ($candidate_port) slotuna gecti; onceki slot rollback icin ayakta"
}

case "${1:-status}" in
  deploy)
    [ "$#" -eq 2 ] || { echo "Kullanim: $0 deploy /mutlak/server.js" >&2; exit 2; }
    deploy "$2"
    ;;
  active-port)
    active_port
    ;;
  status)
    echo "active_port=$(active_port)"
    bash "$pm2" status
    ;;
  *)
    echo "Kullanim: $0 {deploy TARGET|active-port|status}" >&2
    exit 2
    ;;
esac
