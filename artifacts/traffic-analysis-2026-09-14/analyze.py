import json,collections
from pathlib import Path
p=Path(__file__).parent;g=json.loads((p/'google.json').read_text());logs=json.loads((p/'logs.json').read_text());db=json.loads((p/'db.json').read_text())
out={}
for a,b,label in [('last7','prior7','weekly'),('continuation','previous','period')]:
 old=g['windows'][b];new=g['windows'][a];A=old['total']['rows'][0];B=new['total']['rows'][0]
 v={'old':A,'new':B,'clickDelta':B['clicks']-A['clicks'],'clickChangePct':100*(B['clicks']/A['clicks']-1),'impressionEffect':(B['impressions']-A['impressions'])*A['ctr'],'ctrEffect':B['impressions']*(B['ctr']-A['ctr'])}
 for dim in ['page','query','device','country']:
  aa={r['keys'][0]:r for r in old[dim]['rows']};bb={r['keys'][0]:r for r in new[dim]['rows']};rows=[]
  for k in aa.keys()|bb.keys():
   r=aa.get(k,{'clicks':0,'impressions':0,'ctr':None,'position':None});s=bb.get(k,{'clicks':0,'impressions':0,'ctr':None,'position':None})
   rows.append({'key':k,'old':r,'new':s,'delta':s['clicks']-r['clicks']})
  rows.sort(key=lambda r:r['delta']);v[dim]=rows
  if dim=='page':
   sections={}
   from urllib.parse import urlparse
   for r in rows:
    path=urlparse(r['key']).path
    key=path.split('/')[1] if path!='/' else 'ana sayfa'
    z=sections.setdefault(key,{'oldClicks':0,'newClicks':0,'oldImpressions':0,'newImpressions':0})
    for period,raw in [('old',r['old']),('new',r['new'])]:
     z[period+'Clicks']+=raw['clicks'];z[period+'Impressions']+=raw['impressions']
   v['sections']=sections
 v['queryCoverage']={n:sum(r['clicks']for r in w['query']['rows'])/w['total']['rows'][0]['clicks'] for n,w in [('old',old),('new',new)]}
 out[label]=v
out['logs']={}
for name,start,end in [('baseline','2026-08-19','2026-08-30'),('current','2026-08-31','2026-09-13'),('previous','2026-08-17','2026-08-30'),('last7','2026-09-07','2026-09-13'),('prior7','2026-08-31','2026-09-06')]:
 c=collections.Counter();err=collections.Counter();pages=collections.Counter();bots=collections.Counter()
 for d,r in logs['daily'].items():
  if start<=d<=end:
   c.update(r);bots.update(logs['crawlers'].get(d,{}))
   for e in logs['errors'].get(d,[]):err[(e['status'],e['path'])]+=e['requests']
   for e in logs['pages'].get(d,[]):pages[(e['channel'],e['path'])]+=e['requests']
 out['logs'][name]={'counts':dict(c),'errors':[{'status':k[0],'path':k[1],'n':v}for k,v in err.most_common(30)],'googlePages':[{'path':k[1],'n':v}for k,v in pages.most_common() if k[0]=='google'][:20],'bots':dict(bots)}
(p/'analysis.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
for label in ['weekly','period']:
 v=out[label];print(label,'delta',v['clickDelta'],'decomp',v['impressionEffect'],v['ctrEffect']);print('sections',v['sections'])
 for dim in ['page','query']:
  print(dim,'LOSERS')
  for r in v[dim][:10]:print(r['key'],r['delta'],r['old']['clicks'],r['new']['clicks'],'imp',r['old']['impressions'],r['new']['impressions'],'pos',r['old']['position'],r['new']['position'])
  print(dim,'GAINERS',[(r['key'],r['delta'])for r in v[dim][-6:]])
print('errors',out['logs']['current']['errors'][:16])
