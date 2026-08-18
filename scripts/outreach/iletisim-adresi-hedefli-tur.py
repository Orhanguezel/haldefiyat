"""Eksik/hatali hedefler icin hedefli tur: alan adi + iletisim yolu acikca verilir."""
import json, os, re, subprocess, time, urllib.request
S=os.environ["SCRAPER_URL"].rstrip("/")+"/api/v1/scrape"; K=os.environ["SCRAPER_API_KEY"]

JOBS = [
 (3,"Anadolu Ajansı — Ekonomi", ["aa.com.tr"], ["/tr/kurumsal/iletisim","/tr/p/iletisim","/tr/kurumsal"]),
 (4,"DHA — Ekonomi", ["dha.com.tr"], ["/iletisim","/kunye","/hakkimizda"]),
 (5,"İHA — Ekonomi", ["iha.com.tr"], ["/iletisim","/kunye","/kurumsal/iletisim"]),
 (9,"Agro Haber", ["agrohaber.com"], ["/iletisim","/kunye","/hakkimizda"]),
 (14,"Mersin Zamanı", ["mersinzamani.com.tr","mersinzamani.com"], ["/iletisim","/kunye",""]),
 (18,"Adana 5 Ocak", ["5ocak.com.tr","gazete5ocak.com.tr"], ["/iletisim","/kunye",""]),
 (19,"Türkiye Ziraat Odaları Birliği (TZOB)", ["tzob.org.tr"], ["/iletisim","/tr/iletisim",""]),
 (20,"İstanbul Ticaret Borsası", ["istib.org.tr"], ["/iletisim","/tr/iletisim","/kurumsal/iletisim"]),
 (21,"Antalya Ticaret Borsası", ["antalyatb.org.tr","atb.org.tr"], ["/iletisim","/tr/iletisim",""]),
 (22,"ANTKOMDER", ["antkomder.org.tr","antkomder.org","antkomder.com"], ["/iletisim","",]),
 (23,"Toprak Mahsulleri Ofisi (TMO)", ["tmo.gov.tr"], ["/iletisim","/Sayfalar/Iletisim","/tr/iletisim",""]),
 (24,"Habertürk — Ekonomi", ["haberturk.com"], ["/kunye","/iletisim","/hakkimizda"]),
 (25,"Sözcü — Ekonomi", ["sozcu.com.tr"], ["/kunye","/iletisim","/hakkimizda"]),
 (27,"Gazete Duvar", ["gazeteduvar.com.tr"], ["/kunye","/iletisim","/hakkimizda"]),
 (1,"Ekonomim", ["ekonomim.com"], ["/kunye","/iletisim"]),
]
EMAIL=re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
JUNK=re.compile(r"(sentry|example\.|@2x|\.(png|jpg|jpeg|gif|svg|webp)$|wixpress|godaddy|domain\.com|yourmail|test@|noreply@|no-reply@|%20|gönderilecek)",re.I)
SKIP=re.compile(r"^(kariyer|ik|hr|reklam|abone|kvkk|bilgiislem|webmaster|satis|muhasebe|fatura|proje|hukuk)",re.I)
EDIT=re.compile(r"^(haber|editor|yazi|redaksiyon|ekonomi|tarim|news|editorial|ihbar|basin|press|pr|medya)",re.I)
GEN=re.compile(r"^(info|iletisim|contact|kurumsal|genel|bilgi|destek|gensek|merkez|posta)",re.I)
mxc={}
def mx(d):
    if d in mxc: return mxc[d]
    try: mxc[d]=bool(subprocess.run(["dig","+short","MX",d],capture_output=True,text=True,timeout=8).stdout.strip())
    except Exception: mxc[d]=False
    return mxc[d]
def scrape(u):
    b=json.dumps({"url":u,"profile":"lead-page","return_text":True,"return_html":True,"mode":"dynamic"}).encode()
    r=urllib.request.Request(S,data=b,headers={"Authorization":"Bearer "+K,"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(r,timeout=75) as x: return json.load(x)
    except Exception as e: return {"success":False,"error":str(e)[:60]}
def mails(res):
    out=set(); h=res.get("html") or ""; t=res.get("text") or ""
    for e in re.findall(r"mailto:([^\"'?>&\s]+)",h): out.add(e.strip().lower().rstrip("\\"))
    for e in (res.get("data") or {}).get("contact_emails") or []: out.add(str(e).strip().lower().rstrip("\\"))
    for e in EMAIL.findall(t[:250000]): out.add(e.strip().lower())
    return {e for e in out if not JUNK.search(e) and 5<len(e)<90 and not e.endswith("kep.tr")}
out=[]
for pid,org,doms,paths in JOBS:
    found={}; used=None
    for d in doms:
        for p in paths:
            u=f"https://{d}{p}"
            r=scrape(u)
            if not r.get("success"): continue
            used=used or d
            for e in mails(r): found.setdefault(e, r.get("final_url") or u)
            if any(EDIT.match(e.split("@")[0]) or GEN.match(e.split("@")[0]) for e in found): break
            time.sleep(0.3)
        if found: break
    rows=[]
    for e,src in found.items():
        loc,_,dom=e.partition("@")
        if SKIP.match(loc): sc,kind=0,"ilgisiz"
        elif EDIT.match(loc): sc,kind=3,"editoryal"
        elif GEN.match(loc): sc,kind=2,"genel"
        else: sc,kind=1,"diğer"
        rows.append({"email":e,"kind":kind,"score":sc,"src":src,"mx":mx(dom)})
    rows.sort(key=lambda r:(-r["score"],r["email"]))
    out.append({"id":pid,"org":org,"domain":used,"emails":rows[:6]})
    best=next((r["email"] for r in rows if r["score"]>=2), rows[0]["email"] if rows else "—")
    print(f"[{pid:2}] {org[:34]:34} {str(used)[:20]:20} {len(rows):2} → {best}",flush=True)
json.dump(out,open("/tmp/retry-harvest.json","w"),ensure_ascii=False,indent=1)
print("\nJSON: /tmp/retry-harvest.json")
