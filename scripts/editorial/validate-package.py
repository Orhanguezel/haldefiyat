#!/usr/bin/env python3
"""Check frozen cohort, pending evidence and encoded video integrity without live writes."""
import csv
import hashlib
import json
import pathlib
import re
import subprocess

root = pathlib.Path(__file__).resolve().parents[2]
p = root / 'artifacts/editorial-ops-2026-09-06'
doc = root / 'docs/EDITORIAL-UYGULAMA-PAKETI-2026-09-06.md'
for target in re.findall(r'\]\(([^)]+)\)', doc.read_text()):
    if not target.startswith('http'):
        assert (doc.parent / target).exists(), target
urls = (p / 'seo-pilot-urls.txt').read_text().splitlines()
assert len(urls) == len(set(urls)) == 241
manifest = json.loads((p / 'seo-pilot-manifest.json').read_text())
assert manifest['sha256'] == hashlib.sha256((p / 'seo-pilot-urls.txt').read_bytes()).hexdigest()
rows = list(csv.DictReader((p / 'card-review.csv').open()))
assert len(rows) == 10 and all(x['approval_status'] == 'not_reviewed' for x in rows)
candidates = json.loads((p / 'firm-pilot-candidates.json').read_text())['candidates']
assert len(candidates) == 10 and all(x['districtSlug'] == 'demre' for x in candidates)
assert all('phone' not in x and 'contactPerson' not in x for x in candidates)
video = json.loads((p / 'video-validation.json').read_text())
assert video['sourceSha256'] == hashlib.sha256((p / 'video-source-card.png').read_bytes()).hexdigest()
for item in video['items']:
    path = p / item['file']
    assert item['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'null', '-'], check=True)
    assert float(item['probe']['format']['duration']) == 20
    assert item['probe']['streams'][0]['width'] == 1080
    assert item['probe']['streams'][0]['height'] == 1920
# Second animation really advances: encoded bottom progress strip differs at 1s vs 15s.
frames = [subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(t), '-i',
          str(p / 'video-02.mp4'), '-frames:v', '1', '-vf', 'crop=1080:14:0:1906',
          '-f', 'md5', '-']) for t in (1, 15)]
assert frames[0] != frames[1]
result = {'status': 'pass', 'frozenEligibleUrls': len(urls), 'unreviewedCardSlots': len(rows),
          'uncontactedFirmCandidates': len(candidates), 'decodedVideos': len(video['items']),
          'publishedOrPaidOutcomeClaimed': False}
(p / 'package-validation.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
