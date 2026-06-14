#!/usr/bin/env python3
"""Firma poster gorsellerinden telefon (ve OCR ham metni) cikar.

halkatalogu firma fotograflari kartvizit/afis taramasidir; isim ve telefon
gorselde basili (HTML'de metin degil) -> fetcher phone=NULL cekiyor.
Bu script tam gorseli grayscale+kontrast+threshold ile isleyip
tesseract (tur+eng, psm 11) ile OCR eder, Turk cep telefonu regex'iyle
numaralari cikarir. Primary'yi hf_firms.phone'a, tumunu raw.ocr_phones'a yazar.

Bagimliliklar (VPS): tesseract-ocr tesseract-ocr-tur python3-pil python3-pymysql
Kullanim:
  python3 scripts/firm-phone-ocr.py              # dry-run, sadece phone IS NULL
  python3 scripts/firm-phone-ocr.py --apply --all # tum fotolu firmalar, DB'ye yaz
  python3 scripts/firm-phone-ocr.py --limit=15    # ilk 15 (test)
"""
import sys, re, io, os, json, time, tempfile, subprocess, urllib.request
from PIL import Image, ImageOps, ImageEnhance
import pymysql

APPLY = "--apply" in sys.argv
ALL = "--all" in sys.argv
LIMIT = 0
for a in sys.argv:
    if a.startswith("--limit="):
        LIMIT = int(a.split("=")[1])

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
PHONE_RE = re.compile(r"0[ .]?5[0-9]{2}[ .]?[0-9]{3}[ .]?[0-9]{2}[ .]?[0-9]{2}")


def env(key, default=""):
    if os.environ.get(key):
        return os.environ[key]
    try:
        for ln in open(".env", "r", encoding="utf-8"):
            if ln.startswith(key + "="):
                return ln.split("=", 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return default


def norm(s):
    d = re.sub(r"\D", "", s)
    if len(d) == 11 and d.startswith("05"):
        return f"{d[0:4]} {d[4:7]} {d[7:9]} {d[9:11]}"
    return None


def ocr_phones(data):
    im = Image.open(io.BytesIO(data)).convert("RGB")
    g = ImageOps.grayscale(im)
    g = ImageEnhance.Contrast(g).enhance(2.2)
    g = g.point(lambda p: 255 if p > 120 else 0)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as t:
        g.save(t.name)
        path = t.name
    try:
        out = subprocess.run(
            ["tesseract", path, "stdout", "-l", "tur+eng", "--psm", "11"],
            capture_output=True, text=True, timeout=60,
        ).stdout
    finally:
        os.unlink(path)
    phones = []
    for m in PHONE_RE.findall(out):
        n = norm(m)
        if n and n not in phones:
            phones.append(n)
    return phones


def main():
    conn = pymysql.connect(host=env("DB_HOST", "127.0.0.1"),
                           user=env("DB_USER", "haldefiyat"),
                           password=env("DB_PASSWORD", env("MYSQL_PASSWORD")),
                           database=env("DB_NAME", "hal_fiyatlari"),
                           charset="utf8mb4")
    cur = conn.cursor()
    where = "photo_url IS NOT NULL" + ("" if ALL else " AND phone IS NULL")
    cur.execute(f"SELECT id, photo_url, phone, raw FROM hf_firms WHERE {where} ORDER BY id"
                + (f" LIMIT {LIMIT}" if LIMIT else ""))
    rows = cur.fetchall()
    print(f"[ocr] hedef={len(rows)} apply={APPLY} all={ALL}")
    proc = found = updated = err = 0
    for fid, url, phone, raw in rows:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            data = urllib.request.urlopen(req, timeout=25).read()
            phones = ocr_phones(data)
            proc += 1
            if phones:
                found += 1
                if APPLY:
                    rawobj = json.loads(raw) if raw else {}
                    rawobj["ocr_phones"] = phones
                    primary = phone or phones[0]
                    cur.execute("UPDATE hf_firms SET phone=%s, raw=%s WHERE id=%s",
                                (primary, json.dumps(rawobj, ensure_ascii=False), fid))
                    conn.commit()
                    updated += 1
                else:
                    print(f"  {fid}: {phones}")
            time.sleep(0.4)
            if proc % 100 == 0:
                print(f"  ... {proc}/{len(rows)} islendi, {found} telefonlu")
        except Exception:
            err += 1
    print(f"[ocr] DONE proc={proc} found={found} updated={updated} err={err}")
    conn.close()


if __name__ == "__main__":
    main()
