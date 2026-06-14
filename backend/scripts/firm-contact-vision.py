#!/usr/bin/env python3
"""Firma poster gorsellerinden KOMISYONCU BAZINDA {isim, telefonlar} cikar (vision).

Bir afiste 2-3 komisyoncu olabilir; her birinin adi + KENDI telefonlari eslestirilir
(duz telefon listesi degil). Anthropic vision modeli layout'u "gorur" ve
{"contacts":[{"name","phones":[...]}]} dondurur. raw.ocr_contacts + raw.ocr_phones +
primary phone/contact_person doldurulur.

Bagimliliklar (VPS): python3-pil python3-pymysql + ANTHROPIC_API_KEY (.env).
Kullanim:
  python3 scripts/firm-contact-vision.py --limit=3        # dry-run test
  python3 scripts/firm-contact-vision.py --apply --all    # tum fotolu firmalar
"""
import os, sys, re, io, json, time, base64, urllib.request
from PIL import Image
import pymysql

APPLY = "--apply" in sys.argv
ALL = "--all" in sys.argv
LIMIT = 0
for a in sys.argv:
    if a.startswith("--limit="):
        LIMIT = int(a.split("=")[1])


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


KEY = env("ANTHROPIC_API_KEY")
MODEL = env("ANTHROPIC_MODEL", "claude-3-5-haiku-latest")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36"
PROMPT = (
    "Bu bir Turkiye hal komisyoncusu afisidir. Afiste bir veya birden fazla "
    "komisyoncu/kisi ve onlara ait telefon numaralari olabilir. Her kisi icin adini "
    "ve KENDI telefon numaralarini eslestir. SADECE su JSON'u dondur, baska hicbir sey "
    "yazma: {\"contacts\":[{\"name\":\"Ad Soyad\",\"phones\":[\"05xx xxx xx xx\"]}]}. "
    "Kisi adi okunamiyorsa name bos birak. Telefon yoksa phones bos dizi."
)


def norm(s):
    d = re.sub(r"\D", "", str(s))
    if len(d) == 10 and d.startswith("5"):
        d = "0" + d
    if len(d) == 11 and d.startswith("05"):
        return f"{d[0:4]} {d[4:7]} {d[7:9]} {d[9:11]}"
    return None


def extract(data):
    im = Image.open(io.BytesIO(data)).convert("RGB")
    im.thumbnail((1280, 1280))
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode()
    body = {
        "model": MODEL,
        "max_tokens": 700,
        "messages": [{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}},
            {"type": "text", "text": PROMPT},
        ]}],
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode(),
        headers={"x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
    )
    r = json.loads(urllib.request.urlopen(req, timeout=60).read())
    txt = "".join(p.get("text", "") for p in r.get("content", []) if p.get("type") == "text")
    m = re.search(r"\{[\s\S]*\}", txt)
    obj = json.loads(m.group(0)) if m else {"contacts": []}
    out = []
    for c in obj.get("contacts", []):
        phones = []
        for p in (c.get("phones") or []):
            n = norm(p)
            if n and n not in phones:
                phones.append(n)
        name = (c.get("name") or "").strip()
        if name or phones:
            out.append({"name": name, "phones": phones})
    return out


def main():
    if not KEY:
        print("ANTHROPIC_API_KEY yok")
        return
    conn = pymysql.connect(host=env("DB_HOST", "127.0.0.1"),
                           user=env("DB_USER", "haldefiyat"),
                           password=env("DB_PASSWORD", env("MYSQL_PASSWORD")),
                           database=env("DB_NAME", "hal_fiyatlari"),
                           charset="utf8mb4")
    cur = conn.cursor()
    # Resumable + maliyet-verimli: zaten ocr_contacts'i olan firmalari atla (kredi bitse de bastan baslamaz).
    where = ("photo_url IS NOT NULL AND COALESCE(JSON_LENGTH(raw->'$.ocr_contacts'),0)=0"
             + ("" if ALL else " AND phone IS NULL"))
    cur.execute(f"SELECT id, photo_url, phone, contact_person, raw FROM hf_firms WHERE {where} ORDER BY id"
                + (f" LIMIT {LIMIT}" if LIMIT else ""))
    rows = cur.fetchall()
    print(f"[vision] model={MODEL} hedef={len(rows)} apply={APPLY} all={ALL}")
    proc = found = updated = err = 0
    for fid, url, phone, cperson, raw in rows:
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=25).read()
            contacts = extract(data)
            proc += 1
            allp = [p for c in contacts for p in c["phones"]]
            if contacts and allp:
                found += 1
                if APPLY:
                    rawobj = json.loads(raw) if raw else {}
                    rawobj["ocr_contacts"] = contacts
                    rawobj["ocr_phones"] = list(dict.fromkeys(allp))
                    primary = phone or allp[0]
                    pname = cperson or next((c["name"] for c in contacts if c["name"]), None)
                    cur.execute(
                        "UPDATE hf_firms SET phone=%s, contact_person=COALESCE(contact_person,%s), raw=%s WHERE id=%s",
                        (primary, pname, json.dumps(rawobj, ensure_ascii=False), fid))
                    conn.commit()
                    updated += 1
                else:
                    print(f"  {fid}: {contacts}")
            time.sleep(0.4)
            if proc % 100 == 0:
                print(f"  ... {proc}/{len(rows)} islendi, {found} kisili")
        except Exception as e:
            err += 1
            if err <= 3:
                print(f"  ERR {fid}: {str(e)[:90]}")
    print(f"[vision] DONE proc={proc} found={found} updated={updated} err={err}")
    conn.close()


if __name__ == "__main__":
    main()
