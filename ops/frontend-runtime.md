# Frontend runtime

HaldeFiyat frontend uses Node 24.21.0 at
`/opt/hal-runtime/node-v24.21.0-linux-x64/bin/node`. Install from the official
nodejs.org archive and verify its SHA256 against that release's SHASUMS256.txt.
The system Node remains unchanged.

Node 20.20.1 reproduced the TransformStream cancellation race in 10/10 attempts;
24.21.0 reproduced it in 0/10. The upstream fix is
https://github.com/nodejs/node/pull/62040. Run
`/opt/hal-runtime/node-v24.21.0-linux-x64/bin/node scripts/check-transform-stream.mjs`
before adopting another runtime.

PM2 cluster workers inherit their daemon's Node binary; changing only the
application's interpreter does not upgrade them. This frontend therefore uses
`/root/.pm2-hal-frontend`, supervised by `hal-frontend.service`.

From the repository root:

```sh
bash scripts/frontend-pm2.sh status
bash scripts/frontend-pm2.sh logs hal-frontend --lines 50 --nostream
bash scripts/frontend-pm2.sh reload ecosystem.config.cjs --only hal-frontend --update-env
bash scripts/frontend-pm2.sh save
```

`deploy.sh` uses this manager for frontend operations. Backend and admin remain
in the main PM2 daemon. Never start frontend in both daemons on port 3033.
Production defaults to 3033; `HAL_FRONTEND_PORT` is only for canary validation.
Install `ops/hal-frontend.service` in `/etc/systemd/system/` and
`ops/hal-frontend.logrotate` in `/etc/logrotate.d/hal-frontend-runtime`.

For a code rollback, restore `frontend/standalone-server.js` to the prior
release and reload the two frontend workers sequentially with a port-3033
health check between them. Keep Node 24 for ordinary code rollbacks.

For a runtime rollback, first serve a verified temporary port through Nginx,
stop the dedicated workers, start the old frontend in the main PM2 on 3033,
verify health, restore Nginx to 3033, then remove the temporary server. Disable
`hal-frontend.service` and update the deployment helper before future deploys.
Do not kill or upgrade the shared PM2 daemon to roll back this one application.
