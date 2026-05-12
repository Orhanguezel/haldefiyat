#!/bin/bash
# PM2 launcher — cd to backend dir so dotenv and bun workspace resolution work correctly.
# PM2 with interpreter:bun uses ProcessContainerForkBun.js (CommonJS require shim) which
# breaks bun's workspace-aware module resolution. Using bash exec avoids that shim.
cd /root/haldefiyat-src/backend
exec /usr/bin/bun dist/index.js
