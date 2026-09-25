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
      // Shell script launcher: ensures bun runs as its own process (not via PM2's
      // ProcessContainerForkBun.js require() shim) so bun workspace resolution works.
      script: "backend/start.sh",
      cwd: ".",
      interpreter: "/bin/bash",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 8091,
      },
      env_file: "./backend/.env",
      error_file: "./logs/hal-backend-error.log",
      out_file: "./logs/hal-backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      // pm2 varsayilani 1600 ms: SIGINT'ten 1,6 sn sonra SIGKILL. Devam eden
      // istekler ortasindan kesiliyordu (bkz. index.ts kapanma kancasi).
      kill_timeout: 10000,
      // Kacak buyume sigortasi. 2026-09-01: agrodukkan-frontend'in hicbir
      // ustsiniri yoktu ve 12 gunde 160 MB yerine 2,3 GB'a cikip kutunun
      // bos RAM'ini bitirdi — hal-backend'in acilisi 7 sn'den 21 sn'ye
      // uzadi, admin build'i segfault etti. Esik normalin (~520 MB) uzerinde:
      // gunluk ETL'in mesru sicramasini kesmesin, kacagi kessin.
      max_memory_restart: "900M",
    },
    {
      name: "hal-frontend-blue",
      // Blue/green slotlari scripts/frontend-blue-green.sh yonetir. Ecosystem
      // tanimlari yalniz sifirdan bootstrap/felaket kurtarma icindir.
      script: "standalone-server.js",
      cwd: "./frontend",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3033,
        HOSTNAME: "0.0.0.0",
        // BACKEND_URL: server component'lar için internal backend adresi
        // NEXT_PUBLIC_ olmadığı için build'e baked olmaz — runtime'da okunur
        BACKEND_URL: "http://127.0.0.1:8091",
        // Tarimiklim — ekosistem-ici hava durumu servisi (tarimiklim.com backend)
        TARIMIKLIM_API_URL: "http://127.0.0.1:8088",
      },
      env_file: "./frontend/.env.local",
      error_file: "../logs/hal-frontend-error.log",
      out_file: "../logs/hal-frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      // Trafik diger slota aktarilmadan bu surec sonlandirilmaz.
      kill_timeout: 10000,
      // Worker icin kacak buyume sigortasi (normal ~340 MB).
      max_memory_restart: "700M",
    },
    {
      name: "hal-frontend-green",
      script: "standalone-server.js",
      cwd: "./frontend",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3034,
        HOSTNAME: "0.0.0.0",
        BACKEND_URL: "http://127.0.0.1:8091",
        TARIMIKLIM_API_URL: "http://127.0.0.1:8088",
      },
      env_file: "./frontend/.env.local",
      error_file: "../logs/hal-frontend-green-error.log",
      out_file: "../logs/hal-frontend-green-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 10000,
      max_memory_restart: "700M",
    },
  ],
};
