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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(__dirname, "..");
const STANDALONE_ROOT = join(FRONTEND, ".next", "standalone");

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
  const staticSrc = join(FRONTEND, ".next", "static");
  const staticDest = join(serverDir, ".next", "static");
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

  const linkPath = join(FRONTEND, "standalone-server.js");
  try {
    if (existsSync(linkPath)) unlinkSync(linkPath);
  } catch {
    /* ignore */
  }
  symlinkSync(target, linkPath);
  console.info(
    `sync-standalone-assets: OK → ${staticDest} (${staticSrc})\npm2 script: ${linkPath} → ${target}`,
  );
}

main();
