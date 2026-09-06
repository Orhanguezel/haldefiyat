#!/usr/bin/env python3
"""Render two non-publishing 20s clips from the frozen verified card. Requires ffmpeg."""
import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/editorial-ops-2026-09-06'
SOURCE = OUT / 'video-source-card.png'
BASE = 'scale=1080:1350,pad=1080:1920:0:285:color=0x0b1720,setsar=1'
# Keep the complete source/date/limitations visible. Never crop or replace the quote.
FILTERS = {
    'video-01': BASE + ',fade=t=in:st=0:d=0.7',
    'video-02': BASE + "".join(f",drawbox=x={i*108}:y=1906:w=108:h=14:color=0x36b98f:t=fill:enable=gte(t\\,{i*2})" for i in range(10)),
}
items = []
for name, filters in FILTERS.items():
    path = OUT / (name + '.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1',
                    '-i', str(SOURCE), '-vf', filters, '-t', '20', '-r', '25', '-an',
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', str(path)], check=True)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
               'format=duration,size:stream=width,height,codec_name', '-of', 'json', str(path)]))
    assert float(probe['format']['duration']) == 20
    assert probe['streams'][0]['width'] == 1080 and probe['streams'][0]['height'] == 1920
    items.append({'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'probe': probe})
(OUT / 'video-validation.json').write_text(json.dumps({'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'items': items}, indent=2))
print(json.dumps(items, indent=2))
