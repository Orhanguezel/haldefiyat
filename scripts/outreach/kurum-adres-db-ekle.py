"""Bulunan kurum adreslerini hf_press_contacts'a ekler (varsa gunceller)."""
import json, re

meta = json.load(open("/tmp/kurum-meta.json"))
data = json.load(open("/tmp/kurum2-harvest.json"))

JUNK = re.compile(r"(%20|gönderilecek|sentry|example\.|yourmail|test@|noreply@|abuse@|webmaster@)", re.I)
SKIP = re.compile(r"^(kariyer|ik|hr|reklam|abone|kvkk|webmaster|satis|sales|muhasebe|fatura|hukuk|bilgiislem|booking)", re.I)

TYPE_MAP = {"ihracat":"association","kurum":"other","meslek":"association",
            "sektor":"association","borsa":"chamber","komisyoncu":"association","fakulte":"other"}

def q(s): return "'" + str(s).replace("'", "").replace("\\", "") + "'"

sql, ok, miss = [], 0, []
for r in data:
    m = meta.get(str(r["id"]))
    if not m: continue
    rows = [e for e in r["emails"]
            if not JUNK.search(e["email"]) and not SKIP.match(e["email"].split("@")[0])
            and not e["email"].endswith("kep.tr")]
    # Kurumun kendi alan adindan gelen adres tercih edilir (baska kuruma sicramayi onler).
    own = [e for e in rows if e["email"].split("@")[1].endswith(m["dom"].split(".",1)[-1]) or m["dom"] in e["email"]]
    pick_list = own or rows
    if not pick_list:
        miss.append(m["ad"]); continue
    pick_list.sort(key=lambda x: (-x["score"], not x["mx"]))
    best = pick_list[0]
    alt = ", ".join(e["email"] for e in pick_list[1:4])
    ok += 1
    note = f"kategori: {m['kat']} | site: {m['dom']} | adres kaynagi: {best['src'][:120]} (2026-08-18 site taramasi)"
    if alt: note += f" | alternatif: {alt}"
    sql.append(
        "INSERT INTO hf_press_contacts (organization, publication_type, email, city, tags, status, notes, created_at, updated_at) "
        f"VALUES ({q(m['ad'])}, {q(TYPE_MAP.get(m['kat'],'other'))}, {q(best['email'])}, NULL, "
        f"JSON_ARRAY({q(m['kat'])}, 'tarim', 'kurum'), 'target', {q(note)}, NOW(3), NOW(3)) "
        f"ON DUPLICATE KEY UPDATE email=VALUES(email), notes=VALUES(notes), updated_at=NOW(3);"
    )
open("/tmp/kurum-insert.sql","w").write("\n".join(sql)+"\n")
print(f"eklenecek: {ok} | adres bulunamayan: {len(miss)}")
if miss: print("bulunamayan:", ", ".join(miss[:20]))
