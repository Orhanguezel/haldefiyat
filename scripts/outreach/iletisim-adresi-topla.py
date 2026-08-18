"""Basin/kurum iletisim adresi toplayici v2.

Politika (ihracatradari decision-makers ile ayni): yalniz kurumun KENDI sitesinde
YAYIMLANMIS adresler. LinkedIn kazinmaz, Apollo/ucretli kaynak yok, e-posta tahmini
(pattern) uretilmez — sadece gercekten yayimlanmis adres.

v1'den farki: dynamic mode (fast'te HTML bos geliyor) + mailto: taramasi +
ana sayfadan iletisim linki kesfi + alan adi bulunamayanlar icin DuckDuckGo.
"""
import json, os, re, subprocess, time, urllib.request, urllib.parse

S = os.environ["SCRAPER_URL"].rstrip("/") + "/api/v1/scrape"
K = os.environ["SCRAPER_API_KEY"]

TARGETS = [
    (1,"Ekonomim (eski Dünya Gazetesi)",["ekonomim.com"]),
    (2,"Bloomberg HT",["bloomberght.com"]),
    (3,"Anadolu Ajansı — Ekonomi",["aa.com.tr"]),
    (4,"DHA — Ekonomi",["dha.com.tr"]),
    (5,"İHA — Ekonomi",["iha.com.tr"]),
    (6,"Dünya Gazetesi",["dunya.com"]),
    (7,"Tarım Türk",["tarimturk.com.tr","tarimturk.com"]),
    (8,"Tarımdan Haber",["tarimdanhaber.com"]),
    (9,"Agro Haber",["agrohaber.com"]),
    (10,"Hasat Yayıncılık",["hasad.com.tr"]),
    (11,"Çiftçi TV",["ciftcitv.com"]),
    (12,"Tarım Pusulası",["tarimpusulasi.com"]),
    (13,"Antalya Körfez Gazetesi",["korfezgazetesi.com.tr","antalyakorfez.com"]),
    (14,"Mersin Zamanı",["mersinzamani.com"]),
    (15,"İzmir Ege Telgraf",["egetelgraf.com"]),
    (16,"Bursa Olay",["bursaolay.com","olay.com.tr"]),
    (17,"Konya Yenigün",["konyayenigun.com"]),
    (18,"Adana 5 Ocak",["5ocak.com.tr"]),
    (19,"Türkiye Ziraat Odaları Birliği (TZOB)",["tzob.org.tr"]),
    (20,"İstanbul Ticaret Borsası",["istib.org.tr"]),
    (21,"Antalya Ticaret Borsası",["atb.org.tr"]),
    (22,"ANTKOMDER",["antkomder.org","antkomder.org.tr"]),
    (23,"Toprak Mahsulleri Ofisi (TMO)",["tmo.gov.tr"]),
    (24,"Habertürk — Ekonomi",["haberturk.com"]),
    (25,"Sözcü — Ekonomi",["sozcu.com.tr"]),
    (26,"T24",["t24.com.tr"]),
    (27,"Gazete Duvar",["gazeteduvar.com.tr"]),
    (28,"BBC Türkçe",["bbc.com/turkce"]),
]

EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
LINK  = re.compile(r'href=["\']([^"\']+)["\']', re.I)
CONTACT_HINT = re.compile(r"(iletisim|iletişim|kunye|künye|contact|hakkimizda|hakkında|bize-ulas|kurumsal|imprint)", re.I)
JUNK  = re.compile(r"(sentry|example\.|@2x|\.(png|jpg|jpeg|gif|svg|webp)$|wixpress|godaddy|domain\.com|yourmail|test@|noreply@|no-reply@)", re.I)
EDIT  = re.compile(r"^(haber|editor|yazi|yaziisleri|redaksiyon|ekonomi|tarim|news|editorial|ihbar|basin|press|pr|medya)", re.I)
GEN   = re.compile(r"^(info|iletisim|contact|kurumsal|genel|bilgi|destek|gensek|merkez)", re.I)
SKIP  = re.compile(r"^(kariyer|ik|hr|reklam|abone|kvkk|bilgiislem|webmaster|satis|muhasebe|fatura)", re.I)

mx = {}
def has_mx(d):
    if d in mx: return mx[d]
    try:
        r = subprocess.run(["dig","+short","MX",d],capture_output=True,text=True,timeout=10)
        mx[d] = bool(r.stdout.strip())
    except Exception: mx[d] = False
    return mx[d]

def scrape(u, mode="dynamic"):
    b = json.dumps({"url":u,"profile":"lead-page","return_text":True,"return_html":True,"mode":mode}).encode()
    r = urllib.request.Request(S,data=b,headers={"Authorization":f"Bearer {K}","Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(r,timeout=75) as x: return json.load(x)
    except Exception as e: return {"success":False,"error":str(e)[:70]}

def emails_of(res):
    out=set(); h=res.get("html") or ""; t=res.get("text") or ""
    for e in re.findall(r"mailto:([^\"'?>&\s]+)", h): out.add(e.strip().lower())
    for e in (res.get("data") or {}).get("contact_emails") or []: out.add(str(e).strip().lower())
    for e in EMAIL.findall(t[:250000]): out.add(e.strip().lower())
    return {e for e in out if not JUNK.search(e) and 5 < len(e) < 90}

def contact_links(res, base):
    urls=[]
    for href in LINK.findall(res.get("html") or "")[:900]:
        if not CONTACT_HINT.search(href): continue
        u = urllib.parse.urljoin(base, href.split("#")[0])
        if u.startswith("http") and u not in urls: urls.append(u)
    return urls[:2]

def find_domain(name):
    try:
        q=urllib.parse.quote(f"{name} resmi site iletişim")
        r=urllib.request.Request(f"https://html.duckduckgo.com/html/?q={q}",
            headers={"user-agent":"Mozilla/5.0 (compatible; HalDeFiyat/1.0)"})
        with urllib.request.urlopen(r,timeout=20) as x: html=x.read().decode("utf8","ignore")
        for m in re.findall(r"uddg=([^&\"]+)", html)[:5]:
            host=urllib.parse.urlparse(urllib.parse.unquote(m)).hostname or ""
            host=host.replace("www.","")
            if host and not re.search(r"(duckduckgo|google|bing|facebook|linkedin|instagram|twitter|x\.com|youtube|wikipedia)\.",host):
                return host
    except Exception: pass
    return None

def classify(local):
    if SKIP.match(local): return 0,"ilgisiz"
    if EDIT.match(local): return 3,"editoryal"
    if GEN.match(local):  return 2,"genel"
    return 1,"diğer"

results=[]
for pid, org, doms in TARGETS:
    cands=list(doms)
    found={}; used=None
    for dom in cands:
        base=f"https://{dom}" if "/" not in dom else f"https://{dom}"
        home=scrape(base)
        if not home.get("success"): continue
        used=dom
        for e in emails_of(home): found.setdefault(e, home.get("final_url") or base)
        for link in contact_links(home, base):
            page=scrape(link)
            if page.get("success"):
                for e in emails_of(page): found.setdefault(e, page.get("final_url") or link)
            time.sleep(0.3)
        if found: break
    if not found and not used:
        alt=find_domain(org)
        if alt:
            home=scrape(f"https://{alt}")
            if home.get("success"):
                used=alt
                for e in emails_of(home): found.setdefault(e, home.get("final_url") or alt)
                for link in contact_links(home, f"https://{alt}"):
                    page=scrape(link)
                    if page.get("success"):
                        for e in emails_of(page): found.setdefault(e, page.get("final_url") or link)
    rows=[]
    for e,src in found.items():
        local,_,dom = e.partition("@")
        score,kind = classify(local)
        if dom.endswith("kep.tr"): kind, score = "KEP (resmi tebligat)", 0
        rows.append({"email":e,"kind":kind,"score":score,"src":src,"mx":has_mx(dom)})
    rows.sort(key=lambda r:(-r["score"], r["email"]))
    results.append({"id":pid,"org":org,"domain":used,"emails":rows[:8]})
    best=next((r["email"] for r in rows if r["score"]>=2), rows[0]["email"] if rows else "—")
    print(f"[{pid:2}] {org[:32]:32} {str(used)[:22]:22} {len(rows):2} → {best}", flush=True)

json.dump(results, open("/tmp/press-harvest2.json","w"), ensure_ascii=False, indent=1)
print("\nJSON: /tmp/press-harvest2.json")
