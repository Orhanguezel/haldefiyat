import urllib.request,urllib.error,concurrent.futures,json,time,re
from pathlib import Path
paths=['/','/hal/istanbul-hal-ibb','/hal/kahramanmaras-hal','/urun/sogan-kuru','/urun/domates-salcalik','/urun/patates','/firma/3208-haktan-komisyon-evi-2','/urun/elma-2','/analiz/elma-fiyat-analizi-mayis-2026','/_next/static/chunks/1jvrn-slpfpj7.css','/_next/static/chunks/3tfwshwg68odk.css','/_next/static/chunks/0t9fsotkcm7ew.css','/firmalar?city=bursa&page=2','/api/v1/health','/api/v1/prices?market=istanbul-hal-ibb&limit=2']
def get(path):
 t=time.monotonic()
 try:
  with urllib.request.urlopen(urllib.request.Request('https://haldefiyat.com'+path,headers={'User-Agent':'HaldeFiyat-Report-Audit/1.0'}),timeout=35)as r:
   raw=r.read();s=raw.decode(errors='replace');return {'path':path,'status':r.status,'finalUrl':r.url,'seconds':round(time.monotonic()-t,3),'bytes':len(raw),'title':re.findall(r'<title>(.*?)</title>',s),'canonical':re.findall(r'<link[^>]*rel="canonical"[^>]*>',s),'robots':re.findall(r'<meta[^>]*name="robots"[^>]*>',s),'css':re.findall(r'href="([^\"]+\.css[^\"]*)"',s)[:6]}
 except urllib.error.HTTPError as e:return {'path':path,'status':e.code,'seconds':round(time.monotonic()-t,3)}
 except Exception as e:return {'path':path,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as ex:r=list(ex.map(get,paths))
Path(__file__).with_name('live.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(json.dumps(r,ensure_ascii=False,indent=2))
