/**
 * PWA ikon üreteci — dış bağımlılık gerektirmez.
 * Saf Node.js Buffer + zlib ile geçerli PNG dosyası yazar.
 *
 * Renk: #84f04c (lime brand), köşe yarıçapı ~%20
 * Çalıştır: node scripts/generate-icons.mjs
 */

import { deflateSync } from "zlib";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "../public/icons");

// Brand renk
const BG  = { r: 0x0a, g: 0x0e, b: 0x1a }; // #0a0e1a (koyu arka plan)
const FG  = { r: 0x84, g: 0xf0, b: 0x4c }; // #84f04c (lime)
const TXT = { r: 0x0a, g: 0x0e, b: 0x1a }; // harf rengi (koyu)

// ── CRC-32 ────────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG chunk ─────────────────────────────────────────────────────────────────

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

// ── PNG dosyası ───────────────────────────────────────────────────────────────

function buildPng(size) {
  const radius = Math.round(size * 0.22); // köşe yarıçapı
  const padding = Math.round(size * 0.18); // iç boşluk

  // Piksel verisi (filtre byte + RGB her piksel)
  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(size * rowBytes, 0);

  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const off = y * rowBytes + 1 + x * 3;

      // Köşe yarıçapı maskesi
      const dx = Math.min(x, size - 1 - x);
      const dy = Math.min(y, size - 1 - y);
      let inRoundedRect = true;
      if (dx < radius && dy < radius) {
        const cx = radius - dx, cy = radius - dy;
        inRoundedRect = cx * cx + cy * cy <= radius * radius;
      }

      if (!inRoundedRect) {
        // Şeffaf = arka plan rengi (PNG RGBA olmadığı için)
        raw[off] = BG.r; raw[off + 1] = BG.g; raw[off + 2] = BG.b;
        continue;
      }

      // İçeride: lime yeşil zemin
      let pixel = FG;

      // Basit "H" harfi çiz (iki dikey çizgi + yatay bağlantı)
      const hw = Math.round(size * 0.08);  // çizgi kalınlığı
      const cx = size / 2;
      const top = padding, bot = size - padding;
      const mid = size / 2;
      const midH = Math.round(size * 0.04); // orta çizgi yarı yüksekliği
      const stemL = cx - Math.round(size * 0.14); // sol dikey merkezi
      const stemR = cx + Math.round(size * 0.14); // sağ dikey merkezi

      const inLeftStem  = x >= stemL - hw && x <= stemL + hw && y >= top && y <= bot;
      const inRightStem = x >= stemR - hw && x <= stemR + hw && y >= top && y <= bot;
      const inCrossbar  = x >= stemL - hw && x <= stemR + hw && y >= mid - midH && y <= mid + midH;

      if (inLeftStem || inRightStem || inCrossbar) pixel = TXT;

      raw[off] = pixel.r; raw[off + 1] = pixel.g; raw[off + 2] = pixel.b;
    }
  }

  const compressed = deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  // compression/filter/interlace = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Ana ───────────────────────────────────────────────────────────────────────

for (const size of [192, 512]) {
  const path = `${OUT}/icon-${size}.png`;
  writeFileSync(path, buildPng(size));
  console.log(`✓ ${path} (${size}x${size})`);
}
