#!/bin/bash
set -euo pipefail

# PM2 launcher: run from this script's directory so release paths work.
cd "$(dirname "$0")"

# Load .env (SMTP_*, DB_*, etc) — pm2 reload --update-env tek basina yetmiyor.
# Cron alarm yolu (alerts/email.ts) process.env okuyor, bu yuzden env dosyasi
# runtime'da source edilmeli. Admin endpoint zaten DB'den okuyor, ondan etkilenmez.
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

exec /usr/bin/bun dist/index.js
