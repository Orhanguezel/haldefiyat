#!/usr/bin/env bash
set -euo pipefail
# Node 24 contains nodejs/node#62040 (TransformStream cancel/write race).
# PM2 cluster workers inherit the daemon runtime, not the app interpreter.
node_bin="${HAL_FRONTEND_NODE:-/opt/hal-runtime/node-v24.21.0-linux-x64/bin/node}"
pm2_cli="${HAL_FRONTEND_PM2_CLI:-/usr/lib/node_modules/pm2/bin/pm2}"
test -x "$node_bin"
test -f "$pm2_cli"
export PM2_HOME="${HAL_FRONTEND_PM2_HOME:-/root/.pm2-hal-frontend}"
exec "$node_bin" "$pm2_cli" "$@"
