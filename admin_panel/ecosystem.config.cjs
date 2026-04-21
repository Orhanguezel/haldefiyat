const path = require('path');

const appRoot = process.env.ADMIN_PANEL_CWD || __dirname;
const bindHost = process.env.ADMIN_PANEL_HOST || '127.0.0.1';
const port = process.env.ADMIN_PANEL_PORT || '3030';
const appName = process.env.ADMIN_PANEL_APP_NAME || 'vistaseeds-admin-panel';

module.exports = {
  apps: [
    {
      name: appName,
      cwd: path.resolve(appRoot),
      script: 'bun',
      args: `run start -- -p ${port} -H ${bindHost}`,
      interpreter: 'none',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '450M',
      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 8000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: String(port),
        HOSTNAME: bindHost,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      out_file:
        process.env.ADMIN_PANEL_OUT_LOG ||
        `/home/orhan/.pm2/logs/${appName}.out.log`,
      error_file:
        process.env.ADMIN_PANEL_ERR_LOG ||
        `/home/orhan/.pm2/logs/${appName}.err.log`,
      combine_logs: true,
      time: true,
    },
  ],
};
