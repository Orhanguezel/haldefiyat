#!/usr/bin/env python3
"""
Gunluk fiyat karti ureticisi — WhatsApp/Telegram'da ILETILMEK icin tasarlandi.

Neden gorsel: TR esnaf dunyasinda bilgi link tiklanarak degil, gorsel iletilerek
yayilir. Her iletilme bedava reklamdir; kosedeki filigran siteye trafik getirir.
Link acilmasa bile marka gorulur.

Kullanim:
    python3 scripts/gunluk-fiyat-karti.py                    # gunun hareketlileri
    python3 scripts/gunluk-fiyat-karti.py --market izmir-hal # tek hal karti
    python3 scripts/gunluk-fiyat-karti.py --out /tmp/kart.png --limit 12

Cikti: 1080x1440 PNG (telefonda tek bakista okunur, WhatsApp sikistirmasina dayanir).
"""

import argparse
import datetime as dt
import json
import urllib.request
from PIL import Image, ImageDraw, ImageFont

API = "https://haldefiyat.com/api/v1"
SITE = "haldefiyat.com"

F_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
F_BLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

W, H = 1080, 1440
PAD = 56

INK = (24, 24, 27)
INK_SOFT = (113, 113, 122)
PAPER = (255, 255, 255)
ROW_ALT = (246, 246, 247)
LINE = (228, 228, 231)
BRAND = (234, 88, 12)      # haldefiyat turuncusu
UP = (190, 24, 60)         # fiyat artti — alici icin kotu haber
DOWN = (21, 128, 61)       # fiyat dustu

# Hal karti icin one cikarilacak urunler. Alfabetik siralama ise yaramiyor
# ("Ananas, Armut, Armut, Armut..."); manav/restoran gercekte bunlara bakiyor.
STAPLES = [
    "domates", "patates", "kuru-sogan", "salatalik", "biber-sivri", "biber-dolma",
    "patlican", "kabak", "limon", "elma", "muz", "havuc", "marul", "karpuz",
    "uzum", "seftali", "portakal", "ispanak", "maydanoz", "sivri-biber",
]


def font(path, size):
    return ImageFont.truetype(path, size)


def get(path):
    req = urllib.request.Request(f"{API}{path}", headers={"User-Agent": "haldefiyat-card/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def tr_title(s):
    """Turkce baslik: I -> i donusumu Python'un varsayilaninda yanlis."""
    return s.replace("I", "ı").replace("İ", "i").title() \
            .replace("ı", "ı").replace("Ii", "İ")


def fit(draw, text, fnt, max_w):
    """Metni max_w'ye sigdir, gerekirse kisalt."""
    if draw.textlength(text, font=fnt) <= max_w:
        return text
    while text and draw.textlength(text + "…", font=fnt) > max_w:
        text = text[:-1]
    return text + "…"


def fmt_price(v):
    return f"{v:,.0f}".replace(",", ".") if v >= 100 else f"{v:,.1f}".replace(".", ",")


def build(items, title, subtitle, out_path):
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    f_brand = font(F_BLD, 40)
    f_title = font(F_BLD, 62)
    f_sub = font(F_REG, 32)
    f_prod = font(F_BLD, 38)
    f_meta = font(F_REG, 26)
    f_price = font(F_BLD, 40)
    f_chg = font(F_BLD, 30)
    f_foot = font(F_BLD, 30)
    f_foot_s = font(F_REG, 25)

    # --- Ust bant ---
    d.rectangle([0, 0, W, 14], fill=BRAND)

    y = PAD
    d.text((PAD, y), "HALDEFİYAT", font=f_brand, fill=BRAND)
    tarih = dt.date.today().strftime("%d.%m.%Y")
    tw = d.textlength(tarih, font=f_sub)
    d.text((W - PAD - tw, y + 8), tarih, font=f_sub, fill=INK_SOFT)

    y += 74
    d.text((PAD, y), title, font=f_title, fill=INK)
    y += 78
    d.text((PAD, y), subtitle, font=f_sub, fill=INK_SOFT)
    y += 62
    d.line([PAD, y, W - PAD, y], fill=LINE, width=2)
    y += 10

    # --- Satirlar ---
    row_h = 104
    for i, it in enumerate(items):
        if y + row_h > H - 150:
            break
        if i % 2 == 1:
            d.rectangle([PAD - 16, y, W - PAD + 16, y + row_h], fill=ROW_ALT)

        name = tr_title(it["name"])
        meta = it["meta"]
        chg = it["change_pct"]

        # sag blok once olculur ki isim tasmasin
        price_s = f"{fmt_price(it['latest'])} ₺"
        pw = d.textlength(price_s, font=f_price)

        # Degisim verisi yoksa rozet HIC cizilmez. "▼ %0" yazmak hem yanlis
        # hem de kartin otomatik uretildigini bagirir.
        chg_s = cw = None
        if chg is not None:
            arrow = "▲" if chg > 0 else "▼"
            chg_s = f"{arrow} %{abs(chg):.0f}"
            cw = d.textlength(chg_s, font=f_chg)

        right_w = max(pw, cw or 0)
        name_max = W - 2 * PAD - right_w - 40

        ny = y + 18 if chg is not None else y + 28
        d.text((PAD, ny), fit(d, name, f_prod, name_max), font=f_prod, fill=INK)
        d.text((PAD, ny + 44), fit(d, meta, f_meta, name_max), font=f_meta, fill=INK_SOFT)

        d.text((W - PAD - pw, ny - 4), price_s, font=f_price, fill=INK)
        if chg_s:
            d.text((W - PAD - cw, y + 62), chg_s, font=f_chg, fill=UP if chg > 0 else DOWN)

        y += row_h

    # --- Alt bant / filigran ---
    fy = H - 112
    d.line([PAD, fy - 20, W - PAD, fy - 20], fill=LINE, width=2)
    d.text((PAD, fy), SITE, font=f_foot, fill=BRAND)
    note = "81 ilden günlük hal fiyatları"
    d.text((PAD, fy + 42), note, font=f_foot_s, fill=INK_SOFT)

    d.rectangle([0, H - 14, W, H], fill=BRAND)

    img.save(out_path, "PNG", optimize=True)
    return out_path


def cmd_trending(limit):
    data = get("/prices/trending")
    items = []
    for it in data.get("items", [])[: limit * 2]:
        if it.get("latest") is None or it.get("previous") is None:
            continue
        items.append({
            "name": it["product"]["nameTr"],
            "meta": f"{it['market']['cityName']} · {it['market']['name']}",
            "latest": float(it["latest"]),
            "change_pct": float(it["changePct"]),
        })
        if len(items) >= limit:
            break
    return items, "Günün Hareketlileri", "Hallerde en çok değişen ürünler"


def cmd_market(slug, limit):
    data = get(f"/prices?market={slug}&limit=500")
    rows = data.get("items", [])

    # Alfabetik siralama kartin basini "Ananas, Armut, Armut..." ile dolduruyor;
    # duz staple siralamasi ise 7 cesit domatesi ust uste diziyor. Ikisi de ise
    # yaramaz. Cozum: HER temel urunden BIR tane — manavin bakmak istedigi liste
    # domates, patates, sogan, salatalik... seklinde olmali.
    def staple_of(it):
        s = (it.get("canonicalProduct") or it.get("productSlug") or "")
        for st in STAPLES:
            if s == st or s.startswith(st):
                return st
        return None

    def is_plain(it):
        """Sade varyant tercih edilir: 'Domates' > 'Domates Salcalik (Rio)'."""
        return len(it.get("productName") or "")

    by_staple, others = {}, []
    for it in rows:
        if it.get("avgPrice") is None or not it.get("productSlug"):
            continue
        st = staple_of(it)
        if st is None:
            others.append(it)
        elif st not in by_staple or is_plain(it) < is_plain(by_staple[st]):
            by_staple[st] = it

    ordered = [by_staple[st] for st in STAPLES if st in by_staple]
    ordered += sorted(others, key=is_plain)

    picked = []
    for it in ordered[:limit]:
        picked.append({
            "name": it["productName"],
            "meta": f"{it.get('unit') or 'kg'} · {it.get('cityName') or ''}".strip(" ·"),
            "latest": float(it["avgPrice"]),
            "change_pct": None,   # bu uctan degisim gelmiyor — rozet cizilmez
        })

    name = rows[0]["marketName"] if rows else slug
    tarih = rows[0].get("recordedDate", "") if rows else ""
    return picked, name, f"Toptan fiyatlar · {tarih}" if tarih else "Güncel toptan fiyatlar"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--market", help="hal slug (izmir-hal, ankara-hal ...)")
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--out", default="gunluk-fiyat-karti.png")
    a = ap.parse_args()

    if a.market:
        items, title, sub = cmd_market(a.market, a.limit)
    else:
        items, title, sub = cmd_trending(a.limit)

    if not items:
        raise SystemExit("Veri gelmedi.")

    print(build(items, title, sub, a.out))


if __name__ == "__main__":
    main()
