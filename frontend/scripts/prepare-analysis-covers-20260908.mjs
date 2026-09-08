import sharp from 'sharp';
import fs from 'node:fs/promises';
const base='../artifacts/analysis-covers-2026-09-08';
const assets=JSON.parse(await fs.readFile(`${base}/assets.json`));
const out='../output/imagegen/analysis-covers-2026-09-08';
for(const [key,file] of Object.entries(assets)) {
 const path=`${out}/${key}.webp`;
 await sharp(`/home/orhan/.codex/generated_images/01a07d83-dd18-7800-abc5-3ba09aae6617/${file}`).resize(1600,900,{fit:'cover'}).webp({quality:82}).toFile(path);
 console.log(key,(await fs.stat(path)).size);
}
