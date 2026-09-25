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

The frontend uses a dedicated PM2 home at `/root/.pm2-hal-frontend`, supervised
by `hal-frontend.service`. Backend and admin stay in the main PM2 daemon.

Production is blue/green: `hal-frontend-blue` listens on 3033 and
`hal-frontend-green` listens on 3034. Both are single fork workers. Nginx loads
the active upstream from `/etc/nginx/snippets/haldefiyat-frontend-active.conf`;
only one slot receives new traffic while the other remains available for an
immediate rollback. Do not run these ports from the main PM2 daemon.

From the repository root:

```sh
bash scripts/frontend-blue-green.sh status
bash scripts/frontend-blue-green.sh active-port
bash scripts/frontend-pm2.sh logs hal-frontend-blue --lines 50 --nostream
bash scripts/frontend-pm2.sh logs hal-frontend-green --lines 50 --nostream
```

`deploy.sh` builds an isolated release and passes its exact `server.js` to
`scripts/frontend-blue-green.sh`. The helper starts the inactive slot, checks
and warms it directly, atomically changes the Nginx include, reloads Nginx and
then verifies the public TLS route. A failed candidate never receives traffic;
a failed post-switch check restores the previous upstream. The old release is
kept running after a successful switch.

The tracked recovery template is
`ops/nginx/haldefiyat-frontend-active.conf`. The live copy belongs at
`/etc/nginx/snippets/haldefiyat-frontend-active.conf`, and the site config must
contain this top-level directive instead of a hard-coded upstream block:

```nginx
include /etc/nginx/snippets/haldefiyat-frontend-active.conf;
```

Install `ops/hal-frontend.service` in `/etc/systemd/system/` and
`ops/hal-frontend.logrotate` in `/etc/logrotate.d/hal-frontend-runtime`.

For a code rollback, deploy the prior release's absolute `server.js` with the
same helper. It starts that release in the inactive slot and uses the identical
health-gated switch:

```sh
bash scripts/frontend-blue-green.sh deploy \
  /absolute/path/to/.next-release-COMMIT/standalone/.../server.js
```

For an emergency traffic-only rollback, first confirm the inactive slot is
healthy, replace the live include with the tracked upstream block for its port,
run `nginx -t`, reload Nginx, and verify the public TLS route. Never stop the
currently active slot before traffic has moved and been verified.
