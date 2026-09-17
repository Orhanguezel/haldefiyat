import re,gzip,glob,json,collections,datetime
bot=re.compile(r'bot|crawl|spider|slurp|bingpreview|facebookexternalhit|petal|yandex|python-requests|curl|wget|headless|semrush|DataForSeo|Go-http|scraper|meta-external',re.I)
mobile=re.compile(r'Mobile|Android|iPhone|iPad|Opera Mini|IEMobile')
rows={};pages={};errors={};crawlers={};hours=collections.Counter();files=[]
def empty():return collections.Counter()
for fn in glob.glob('/var/log/nginx/haldefiyat.access.log*'):
 if not re.search(r'access\.log(?:\.\d+(?:\.gz)?)?$',fn):continue
 dates=collections.Counter()
 with (gzip.open(fn,'rt',errors='replace') if fn.endswith('.gz') else open(fn,errors='replace')) as f:
  for line in f:
   q=line.split('"')
   if len(q)<7:continue
   m=re.search(r'\[(\d\d)/(Aug|Sep)/2026:(\d\d):\d\d:\d\d ([+-]\d{4})\]',q[0])
   if not m:continue
   day=f"2026-{'08' if m[2]=='Aug' else '09'}-{m[1]}"
   if not '2026-08-17'<=day<='2026-09-13':continue
   dates[day]+=1
   req=q[1].split();code=q[2].strip().split()[0];ua=q[5];ref=q[3]
   if len(req)<2 or not re.fullmatch(r'[1-5][0-9]{2}',code):continue
   method,url=req[:2];path=url.split('?')[0];isbot=bool(bot.search(ua));s=rows.setdefault(day,empty())
   s['total']+=1;s['bot' if isbot else 'nonbot']+=1;s['status_'+code]+=1
   if not isbot and mobile.search(ua):s['mobile']+=1
   if code.startswith('5') or code in ('404','401','429','413'):errors.setdefault(day,collections.Counter())[(code,path)]+=1
   for name in ['Googlebot','GPTBot','OAI-SearchBot','ClaudeBot','bingbot','Yandex']:
    if name.lower() in ua.lower():crawlers.setdefault(day,empty())[name]+=1
   if 'gclid=' in url:s['gclid_requests']+=1
   if path=='/api/v1/track/pageview':
    s['beacon_requests']+=1
    if method=='POST' and code in ('200','201','204'):s['beacon_success']+=1
   page=method=='GET' and not re.match(r'^/(?:api(?:/|$)|admin(?:/|$)|_next|uploads|og(?:/|$)|assets|\.well-known)',path) and not re.search(r'\.[a-zA-Z0-9]{2,6}$',path)
   if page and not isbot:
    s['page_path_requests']+=1
    if '_rsc=' in url:s['rsc_requests']+=1
    else:
     s['non_rsc_requests']+=1
     if code=='200':
      s['non_rsc_200']+=1
      pages.setdefault(day,collections.Counter())[('all',path)]+=1
      if re.search(r'^https?://(?:www\.)?google\.[^/]+/',ref):
       s['google_ref_200']+=1;pages[day][('google',path)]+=1
      if ref=='-':s['direct_ref_200']+=1
      elif 'haldefiyat.com' in ref:s['internal_ref_200']+=1
      hours[m[3]]+=1
 files.append({'file':fn,'dates':dict(dates)})
print(json.dumps({'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'timezone':'UTC as nginx log +0000; GSC uses America/Los_Angeles','daily':dict(sorted(rows.items())),'pages':{d:[{'channel':k[0],'path':k[1],'requests':v}for k,v in c.most_common()]for d,c in pages.items()},'errors':{d:[{'status':k[0],'path':k[1],'requests':v}for k,v in c.most_common()]for d,c in errors.items()},'crawlers':crawlers,'hours':hours,'files':files},ensure_ascii=False))
