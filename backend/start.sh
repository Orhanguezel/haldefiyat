#!/bin/bash
set -euo pipefail

# PM2 launcher: run from this script's directory so release paths work.
cd "$(dirname "$0")"
exec /usr/bin/bun dist/index.js
