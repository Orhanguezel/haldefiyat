#!/usr/bin/env node
/**
 * Next.js `output: "standalone"` sonrası zorunlu adım:
 * `.next/static` ve `public`, standalone server dizinine kopyalanmazsa
 * prod'da `/_next/static/chunks/*` tamamı 404 olur.
 *
 * deploy.sh içinde de aynı iş yapılıyor; `next build` tek başına yetmez.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(__dirname, "..");
const DIST_DIR = process.env.NEXT_DIST_DIR?.trim() || ".next";
if (DIST_DIR.includes("/") || DIST_DIR.includes("\\") || !/^\.next(?:-release-[a-f0-9]+)?$/u.test(DIST_DIR)) {
  throw new Error(`Guvenli olmayan NEXT_DIST_DIR: ${DIST_DIR}`);
}
const STANDALONE_ROOT = join(FRONTEND, DIST_DIR, "standalone");

const SKIP_DIRS = new Set(["node_modules", ".bun", ".git"]);

function findServerJs(dir, depth = 0) {
  if (depth > 24 || !existsSync(dir)) return null;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      const hit = findServerJs(p, depth + 1);
      if (hit) return hit;
    } else if (name === "server.js") {
      return p;
    }
  }
  return null;
}

function main() {
  if (!existsSync(STANDALONE_ROOT)) {
    console.info(
      "sync-standalone-assets: .next/standalone yok — standalone build değil veya build eksik, çıkılıyor.",
    );
    process.exit(0);
  }

  const target = findServerJs(STANDALONE_ROOT);
  if (!target) {
    console.warn(
      "sync-standalone-assets: standalone içinde server.js bulunamadı — çıkılıyor.",
    );
    process.exit(0);
  }

  const serverDir = dirname(target);
  const staticSrc = join(FRONTEND, DIST_DIR, "static");
  const staticDest = join(serverDir, DIST_DIR, "static");
  const publicSrc = join(FRONTEND, "public");
  const publicDest = join(serverDir, "public");

  if (!existsSync(staticSrc)) {
    console.warn("sync-standalone-assets: .next/static yok — önce next build çalıştırın.");
    process.exit(1);
  }

  mkdirSync(staticDest, { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });

  mkdirSync(publicDest, { recursive: true });
  if (existsSync(publicSrc)) {
    cpSync(publicSrc, publicDest, { recursive: true });
  }

  console.info(`sync-standalone-assets: static + public kopyalandı → ${staticDest} (${staticSrc})`);

  // standalone-server.js symlink (admin pm2 dogrudan server.js kullaniyor; symlink opsiyonel).
  // Broken symlink / EEXIST durumunda build'i KIRMA — kritik kopyalama zaten bitti.
  // Symlink hedefi GORELI yazilir. Mutlak yazilirsa link makineye baglanir
  // (local /home/orhan/..., VPS /var/www/...), git'te kalici "modified" olarak
  // gorunur ve bir gun checkout/reset yerse yanlis makinenin yolunu geri koyup
  // pm2'yi kirar. Goreli yol iki makinede de ayni.
  const linkPath = join(FRONTEND, "standalone-server.js");
  const relTarget = relative(FRONTEND, target);
  try {
    // unlink kosulsuz: existsSync symlink'i TAKIP eder, KIRIK symlink'te
    // false doner ve symlinkSync EEXIST ile patlardi.
    try {
      unlinkSync(linkPath);
    } catch {
      /* yoksa sorun değil */
    }
    symlinkSync(relTarget, linkPath);
    console.info(`pm2 script symlink: ${linkPath} → ${relTarget}`);
  } catch (err) {
    console.warn(`sync-standalone-assets: symlink atlandı (kritik değil): ${err?.message ?? err}`);
  }
}

main();
