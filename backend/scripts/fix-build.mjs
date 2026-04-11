/**
 * fix-build.mjs
 *
 * İki işlem yapar:
 * 1. @/foo → görece yol (tsconfig paths: "@/*": ["src/*"])
 * 2. Uzantısız görece import'lara .js ekler (ESM strict-mode uyumluluğu)
 *
 * NOT: @agro/shared-backend/* bare import olarak bırakılır.
 * VPS'te node_modules/@agro/shared-backend symlink ile çözülür.
 * tsc-alias, moduleResolution:"Bundler" ile bu scoped-package yollarını
 * çözmediğinden dist/node_modules symlink yaklaşımı kullanılır.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, posix } from 'node:path';

const DIST_DIR = resolve(process.cwd(), 'dist');

const JS_RE = /\.(m?js)$/i;

// @/foo/bar → görece yol (dist/ içindeki aynı modül)
const AT_SLASH_RE = /(['"])@\/([^'"]+)\1/g;

// Uzantısız görece import: from './foo' veya from '../bar'
const LOCAL_IMPORT_RE = /(import\s+[^'"]*?from\s*|export\s+[^'"]*?from\s*)(["'])(\.{1,2}\/[^"']+)\2/g;
const DYNAMIC_RE = /(import\()\s*(["'])(\.{1,2}\/[^"']+)\2(\s*\))/g;

function hasExt(spec) {
  return /\.[cm]?[jt]s$|\.json$/i.test(spec);
}

function resolveWithJs(fileDir, spec) {
  if (hasExt(spec)) return spec;
  const abs = resolve(fileDir, spec);
  if (existsSync(abs + '.js')) return spec + '.js';
  if (existsSync(join(fileDir, spec, 'index.js'))) return spec + '/index.js';
  return spec + '.js';
}

function fixFile(filePath) {
  let code = readFileSync(filePath, 'utf8');
  const fileDir = dirname(filePath);

  // 1. @/ → görece yol (dist/ içindeki aynı modül)
  code = code.replace(AT_SLASH_RE, (_, q, subpath) => {
    const target = join(DIST_DIR, subpath);
    let rel = posix.normalize(relative(fileDir, target).replace(/\\/g, '/'));
    if (!rel.startsWith('.')) rel = './' + rel;
    if (!hasExt(rel)) {
      if (existsSync(target + '.js')) rel += '.js';
      else if (existsSync(join(target, 'index.js'))) rel += '/index.js';
      else rel += '.js';
    }
    return `${q}${rel}${q}`;
  });

  // 2. Uzantısız görece import'lara .js ekle
  code = code.replace(LOCAL_IMPORT_RE, (_, pre, q, spec) => {
    const fixed = resolveWithJs(fileDir, spec);
    return `${pre}${q}${fixed}${q}`;
  });

  code = code.replace(DYNAMIC_RE, (_, pre, q, spec, post) => {
    const fixed = resolveWithJs(fileDir, spec);
    return `${pre}${q}${fixed}${q}${post}`;
  });

  writeFileSync(filePath, code, 'utf8');
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (JS_RE.test(p)) fixFile(p);
  }
}

if (!existsSync(DIST_DIR)) {
  console.error('dist/ bulunamadı — önce tsc çalışmalı.');
  process.exit(1);
}

walk(DIST_DIR);
console.log('✔ ESM uzantıları ve @/ yolları düzeltildi.');
