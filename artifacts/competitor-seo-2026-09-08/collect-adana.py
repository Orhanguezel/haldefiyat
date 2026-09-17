import urllib.request,concurrent.futures,pathlib,json,time,hashlib
from bs4 import BeautifulSoup
p=pathlib.Path(__file__).parent/'adana-raw';base='https://www.adana.bel.tr'
def get(url):
 for attempt in range(3):
  try:return urllib.request.urlopen(url,timeout=30).read()
  except Exception:
   if attempt==2:raise
   time.sleep(1)
links=set()
for off in range(0,100,5):
 url=base+'/tr/hal-fiyat-listesi'+('/'+str(off) if off else '')
 html=get(url);(p/f'list-{off}.html').write_bytes(html)
 s=BeautifulSoup(html,'html.parser');links.update(a['href'] for a in s.select('a[href]') if '/tr/hal-detay/' in a['href'])
def fetch(url):
 html=get(url);s=BeautifulSoup(html,'html.parser');h=s.select_one('h4');title=h.get_text(' ',strip=True) if h else '';id=url.rsplit('/',1)[-1];(p/f'{id}.html').write_bytes(html);return dict(url=url,file=f'{id}.html',title=title,sha256=hashlib.sha256(html).hexdigest())
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:rows=list(ex.map(fetch,sorted(links)))
(p/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Captured',len(rows),'official bulletins')
