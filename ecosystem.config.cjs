/**
 * PM2 Ecosystem — HaldeFiyat
 *
 * Kullanım:
 *   pm2 start ecosystem.config.cjs          # tüm servisler
 *   pm2 start ecosystem.config.cjs --only hal-backend
 *   pm2 save && pm2 startup
 */

module.exports = {
  apps: [
    {
      name: "hal-backend",
      script: "dist/index.js",
      cwd: "./backend",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 8088,
      },
      env_file: "./backend/.env",
      error_file: "../logs/hal-backend-error.log",
      out_file: "../logs/hal-backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
    },
    {
      name: "hal-frontend",
      script: ".next/standalone/server.js",
      cwd: "./frontend",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3033,
        HOSTNAME: "0.0.0.0",
      },
      env_file: "./frontend/.env.local",
      error_file: "../logs/hal-frontend-error.log",
      out_file: "../logs/hal-frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
