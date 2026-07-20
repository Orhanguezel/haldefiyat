#!/usr/bin/env python3
"""
hal.gov.tr gecmis backfill — hacim agirlikli parser ile gecmis gunleri yeniden ceker.

Neden: eski parser cok-satirli urunlerde (uretim turu + varyete) duz ortalama
aliyordu ve Islem Hacmi sutununu atiyordu. Sonuc: yaprak sebzelerde absurt
degerler (kekik 942 TL/kg, adacayi 2001 TL/kg). Parser artik hacim agirlikli
(bkz. mergeHalGovTrByVolume). hal.gov.tr tarih-parametreli oldugu icin gecmis
GERCEK veriyle yeniden cekilebiliyor — silmek/karantina yerine duzeltme.

Kullanim (VPS, backend dizininden):
    python3 scripts/backfill_halgovtr.py [BASLANGIC] [BITIS]
    # ornek: python3 scripts/backfill_halgovtr.py 2026-05-02 2026-07-19

Her gun onDuplicateKey ile UPSERT edilir; tekrar calistirmak guvenli.
Ilerleme /tmp/halgovtr-backfill.log dosyasina yazilir.
"""
import hmac, hashlib, base64, json, os, time, urllib.request, datetime, sys

API = "http://localhost:8091/api/v1/admin/hal/etl/run"
ADMIN_SUB = "4f618a8d-6fdb-498c-898a-395d368b2193"


def b64(d):
    if isinstance(d, str):
        d = d.encode()
    return base64.urlsafe_b64encode(d).rstrip(b"=").decode()


def make_jwt(secret):
    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}))
    payload = b64(json.dumps({
        "sub": ADMIN_SUB, "role": "admin",
        "iat": int(time.time()), "exp": int(time.time()) + 21600,
    }))
    sig = hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    return f"{header}.{payload}.{b64(sig)}"


def read_secret():
    for line in open(".env", encoding="utf-8"):
        if line.startswith("JWT_SECRET="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(".env icinde JWT_SECRET yok")


def main():
    start = datetime.date.fromisoformat(sys.argv[1] if len(sys.argv) > 1 else "2026-05-02")
    end = datetime.date.fromisoformat(sys.argv[2] if len(sys.argv) > 2 else "2026-07-19")
    token = make_jwt(read_secret())

    log = open("/tmp/halgovtr-backfill.log", "w", encoding="utf-8")
    day = start
    ok = fail = 0
    while day <= end:
        body = json.dumps({"source": "hal_gov_tr_ulusal", "date": day.isoformat()}).encode()
        req = urllib.request.Request(API, data=body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        })
        try:
            resp = json.load(urllib.request.urlopen(req, timeout=180))
            inserted = resp.get("result", {}).get("inserted", "ERR")
            ok += 1
        except Exception as exc:  # noqa: BLE001 — her hata loglanir, dongu devam eder
            inserted = f"ERR({type(exc).__name__})"
            fail += 1
        line = f"{time.strftime('%H:%M:%S')} {day} -> inserted={inserted}\n"
        log.write(line)
        log.flush()
        day += datetime.timedelta(days=1)
        time.sleep(1)
    log.write(f"BITTI: ok={ok} fail={fail}\n")
    log.close()


if __name__ == "__main__":
    main()
