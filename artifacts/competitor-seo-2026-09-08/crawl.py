import json,concurrent.futures,urllib.request,pathlib
from bs4 import BeautifulSoup
root=pathlib.Path(__file__).parent
paths=['/urun/limon','/urun/limon-mayer','/urun/domates-salcalik','/urun/uzum','/hal/kocaeli-hal-merkez','/hal/istanbul-hal-ibb','/hal/mersin-hal','/fiyat/adana/limon','/fiyat/adana/limon-mayer','/fiyat/mersin/limon','/piyasa/erdemli-limon','/analiz/limon-fiyatlari-2026-mersin-erdemli-piyasa-analizi']
def get(path):
 url='https://haldefiyat.com'+path
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=50);html=r.read().decode();s=BeautifulSoup(html,'html.parser')
  for tag in s(['script','style','nav','footer']):tag.decompose()
  text=s.get_text(' ',strip=True);(root/(path.strip('/').replace('/','_')+'.txt')).write_text(text)
  return dict(path=path,status=r.status,url=r.url,title=s.title.get_text() if s.title else '',canonical=[l.get('href') for l in s.select('link[rel=canonical]')],robots=[m.get('content') for m in s.select('meta[name=robots]')],h1=[h.get_text(' ',strip=True) for h in s.select('h1')],text=text,links=[a.get('href') for a in s.select('a[href]')])
 except Exception as e:return dict(path=path,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:rows=list(ex.map(get,paths))
(root/'page-evidence.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for r in rows:print(r['path'],r.get('status'),r.get('robots'),r.get('error',''))
