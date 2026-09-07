#!/usr/bin/env python3
"""Official monthly cotton series. Raw responses are cached and SHA-256 addressed.
Usage: python3 backend/scripts/cotton-series/collect.py --through 2026-09-07
Requires Python 3, beautifulsoup4 and pdftotext. Never writes operational prices.
"""
import argparse, calendar, concurrent.futures, csv, hashlib, json, re, subprocess, time
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from bs4 import BeautifulSoup

VERSION = 'cotton-monthly-v1'
class SourceDocumentError(ValueError):
    pass

def number(s):
    s = s.strip().replace('\xa0', '').replace(' ', '')
    if not s or s in ('-', '--', '---', '—'): return None
    if not re.fullmatch(r'-?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?', s):
        raise ValueError('Invalid Turkish number: '+s)
    return str(Decimal(s.replace('.', '').replace(',', '.')))

def month_ranges(start, through):
    d = date.fromisoformat(start+'-01')
    while d <= through:
        end = min(date(d.year, d.month, calendar.monthrange(d.year,d.month)[1]), through)
        yield d.isoformat(), end.isoformat()
        d = date(d.year+1,1,1) if d.month == 12 else date(d.year,d.month+1,1)

def make_row(source, start, end, product, form, sale, payment, basis, values, url, digest, raw_line, method):
    dims = [source, product, form, sale, payment, basis, 'TRY/kg', method]
    series_id = hashlib.sha256(json.dumps(dims,ensure_ascii=False).encode()).hexdigest()[:24]
    return dict(series_id=series_id, observation_id=hashlib.sha256((series_id+'|'+start+'|'+end).encode()).hexdigest(),
        source=source, period_start=start, period_end=end, period_complete=end==date(date.fromisoformat(start).year,date.fromisoformat(start).month,calendar.monthrange(date.fromisoformat(start).year,date.fromisoformat(start).month)[1]).isoformat(),
        product=product, cotton_form=form, sale_type=sale, payment_type=payment, price_basis=basis,
        unit='TRY/kg', average_method=method, **values, source_url=url, source_sha256=digest, raw_line=raw_line, parser_version=VERSION)

def parse_sutb(html, start, end, url, digest):
    soup = BeautifulSoup(html, 'html.parser')
    if not soup.select('table') or 'Ortalama Fiyat' not in soup.get_text(): raise ValueError('Missing SUTB bulletin table')
    # Server must echo the requested date interval; a default-day response is not historical evidence.
    for field, expected in [('BASLAMATARIHI',start),('BITISTARIHI',end)]:
        field_node=soup.find('input',{'name':field})
        if not field_node or field_node.get('value')!=date.fromisoformat(expected).strftime('%d.%m.%Y'):
            raise ValueError('SUTB did not echo requested dates')
    rows=[]; rejected=[]
    for tr in soup.select('tbody tr'):
        c=[x.get_text(' ',strip=True) for x in tr.find_all('td')]
        if len(c)<3 or c[0]!='TEKSTİL MADDELERİ' or 'PAMUK' not in c[1]: continue
        try:
            if len(c)!=13: raise ValueError('Expected 13 columns')
            if c[9] not in ('KĞ','KG','Kg','Kg.','Kğ'): raise ValueError('Unexpected unit '+c[9])
            form='seed_cotton' if 'KÜTLÜ' in c[1] else ('linter' if 'LİNTER' in c[2] else 'lint')
            if c[3]!=c[11]: raise ValueError('Sale type columns disagree')
            values=dict(min_price=number(c[5]),max_price=number(c[6]),avg_price=number(c[7]),quantity_kg=number(c[8]),turnover_try=number(c[10]),transaction_count=int(number(c[4])),derived_weighted_price=None)
            if Decimal(values['quantity_kg'] or '0')>0 and values['turnover_try'] is not None:
                values['derived_weighted_price']=str((Decimal(values['turnover_try'])/Decimal(values['quantity_kg'])).quantize(Decimal('.000001')))
            rows.append(make_row('sutb',start,end,c[2],form,c[3],c[12] or 'UNSPECIFIED','registered_transaction',values,url,digest,' | '.join(c),'source_reported_unspecified'))
        except (ValueError,InvalidOperation,TypeError) as e: rejected.append({'source_url':url,'raw_line':' | '.join(c),'error':str(e)})
    return rows,rejected

def parse_itb(text, start, end, url, digest):
    # Only the local monthly closing-price section. Never consume exchange rates, imports or Cotlook.
    lines=text.splitlines()
    months=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
    expected=months[int(start[5:7])-1]+' '+start[2:4]
    if expected not in ' '.join(x.strip() for x in lines[:4]):raise SourceDocumentError('document_month_mismatch: '+expected)
    begin=next((i for i,x in enumerate(lines) if 'KAPANIŞ FİYATLARI' in x),None)
    if begin is None: raise SourceDocumentError('wrong_document_missing_local_price_section')
    rows=[]; rejected=[]; method=None
    for line in lines[begin+1:]:
        if 'DÜNYA PİYASALARI' in line or 'WORLD MARKET' in line: break
        if 'Hazır Peşin' in line:
            method='ready_cash_and_nominal_average' if 'İsmen' in line else 'ready_cash_average'
        if not re.match(r'^\s*(?:\d{2}\s+Renk|Std\.|Beyaz\s+Std)',line): continue
        cells=re.split(r'\s{2,}',line.strip())
        try:
            if len(cells)!=6: raise ValueError(f'Expected label and five value columns, got {len(cells)}')
            product=cells[0]; numbers=[str(Decimal(x)) if re.fullmatch(r'\d+\.\d{2}',x) else number(x) for x in cells[1:]]
            rows.append((product,dict(min_price=numbers[0],max_price=numbers[1],avg_price=numbers[2],quantity_kg=None,turnover_try=None,transaction_count=None,derived_weighted_price=None),line.strip()))
        except (ValueError,InvalidOperation) as e: rejected.append({'source_url':url,'raw_line':line.strip(),'error':str(e)})
    if not method: raise ValueError('Missing ITB average-method footnote')
    if not rows and not rejected: raise ValueError('No recognized local cotton grade rows')
    return [make_row('itb',start,end,product,'lint','UNSPECIFIED','PEŞİN / İSMEN' if 'nominal' in method else 'PEŞİN','monthly_closing',values,url,digest,line,method) for product,values,line in rows],rejected

def validate(row):
    errors=[]
    lo,hi,av=[Decimal(row[k]) if row[k] is not None else None for k in ['min_price','max_price','avg_price']]
    if lo is None or hi is None or av is None: errors.append('missing_price')
    elif lo<=0 or hi<lo or not lo<=av<=hi: errors.append('price_order_or_nonpositive')
    if row['transaction_count'] is not None and row['transaction_count']<=0: errors.append('nonpositive_transaction_count')
    if row['quantity_kg'] is not None and Decimal(row['quantity_kg'])<=0: errors.append('nonpositive_quantity')
    if row['derived_weighted_price'] is not None and lo is not None and hi is not None:
        weighted=Decimal(row['derived_weighted_price'])
        if weighted<lo-Decimal('.02') or weighted>hi+Decimal('.02'):errors.append('turnover_quantity_outside_price_range')
    return errors

def fetch(url, raw_dir, refresh=False):
    key=hashlib.sha256(url.encode()).hexdigest();path=raw_dir/key;meta_path=raw_dir/(key+'.json')
    if path.exists() and meta_path.exists() and not refresh:
        content=path.read_bytes();meta=json.loads(meta_path.read_text())
        if hashlib.sha256(content).hexdigest()!=meta['sha256']:raise ValueError('Raw cache checksum mismatch')
        return content,meta
    for attempt in range(3):
        try:
            with urlopen(Request(url,headers={'User-Agent':'HaldeFiyat Research/1.0 (+https://haldefiyat.com)'}),timeout=40) as r:content=r.read()
            meta=dict(url=url,sha256=hashlib.sha256(content).hexdigest(),retrieved_at=datetime.now(timezone.utc).isoformat(),bytes=len(content))
            path.write_bytes(content);meta_path.write_text(json.dumps(meta,indent=2));return content,meta
        except Exception:
            if attempt==2:raise
            time.sleep(1+attempt)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--from-month',default='2013-01');parser.add_argument('--through',required=True);parser.add_argument('--output',default='data/cotton-series');parser.add_argument('--workers',type=int,default=2);parser.add_argument('--refresh',action='store_true');args=parser.parse_args()
    through=date.fromisoformat(args.through)
    if through>date.today():raise ValueError('Future cutoff refused')
    out=Path(args.output);raw=out/'raw';raw.mkdir(parents=True,exist_ok=True)
    index_url='https://itb.org.tr/AylikBultenler/5-pamuk-bulteni';content,meta=fetch(index_url,raw,True)
    links=sorted(set(re.findall(r'[\"\x27]([^\"\x27]*pamuk-bulteni-5\.pdf)',content.decode(),re.I)))
    tasks=[]
    for start,end in month_ranges(args.from_month,through):
        query=urlencode({'bultenturu':5,'BASLAMATARIHI':date.fromisoformat(start).strftime('%d.%m.%Y'),'BITISTARIHI':date.fromisoformat(end).strftime('%d.%m.%Y')})
        tasks.append(('sutb',start,end,'https://uye.sutb.org.tr:3333/bultenweb?'+query))
        file=next((x for x in links if x[:6]==start[:7].replace('-','')),None)
        if file and end==date(date.fromisoformat(start).year,date.fromisoformat(start).month,calendar.monthrange(date.fromisoformat(start).year,date.fromisoformat(start).month)[1]).isoformat():tasks.append(('itb',start,end,'https://itb.org.tr/dosya/bulten/'+file))
    def process(task):
        source,start,end,url=task
        try:
            body,meta=fetch(url,raw,args.refresh)
            if source=='itb':
                if not body.startswith(b'%PDF'):raise ValueError('Expected PDF')
                text=subprocess.run(['pdftotext','-layout',str(raw/hashlib.sha256(url.encode()).hexdigest()),'-'],capture_output=True,check=True).stdout.decode()
                (raw/(meta['sha256']+'.txt')).write_text(text)
                rows,rejected=parse_itb(text,start,end,url,meta['sha256'])
            else: rows,rejected=parse_sutb(body.decode(),start,end,url,meta['sha256'])
            accepted=[]
            for r in rows:
                errors=validate(r)
                if errors:rejected.append(dict(row=r,error=','.join(errors)))
                else:accepted.append(r)
            return accepted,rejected,dict(source=source,period_start=start,period_end=end,source_url=url,source_sha256=meta['sha256'],retrieved_at=meta['retrieved_at'],status='quarantine' if rejected else ('ok' if rows else 'no_cotton_rows'),accepted=len(accepted),rejected=len(rejected))
        except SourceDocumentError as e:return [],[dict(source_url=url,source_sha256=meta['sha256'],error=str(e))],dict(source=source,period_start=start,period_end=end,source_url=url,status='wrong_document',error=str(e))
        except Exception as e:return [],[],dict(source=source,period_start=start,period_end=end,source_url=url,status='error',error=str(e))
    rows=[];rejected=[];coverage=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(4,args.workers))) as executor:
        for i,(rs,qs,cs) in enumerate(executor.map(process,tasks)):
            rows.extend(rs);rejected.extend(qs);coverage.append(cs)
            if (i+1)%20==0:print(f'{i+1}/{len(tasks)} bulletins; {len(rows)} rows; {len(rejected)} quarantined',flush=True)
    # Ambiguous duplicate grain is quarantined, never collapsed into an invented average.
    groups={}
    for r in rows:groups.setdefault(r['observation_id'],[]).append(r)
    accepted=[]
    for g in groups.values():
        if len(g)==1:accepted.extend(g)
        else:rejected.extend({'row':r,'error':'duplicate_observation_grain'} for r in g)
    for c in coverage:
        c['accepted']=sum(r['source_url']==c['source_url'] for r in accepted)
        c['rejected']=sum(q.get('source_url',q.get('row',{}).get('source_url'))==c['source_url'] for q in rejected)
        if c['rejected'] and c['status']=='ok':c['status']='quarantine'
    accepted.sort(key=lambda r:(r['source'],r['series_id'],r['period_start']))
    (out/'observations.json').write_text(json.dumps(accepted,ensure_ascii=False,indent=2))
    (out/'quarantine.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=2))
    (out/'coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
    if accepted:
        with (out/'observations.csv').open('w',newline='',encoding='utf-8-sig') as f:
            w=csv.DictWriter(f,fieldnames=list(accepted[0]));w.writeheader();w.writerows(accepted)
    summary=dict(version=VERSION,from_month=args.from_month,through=args.through,rows=len(accepted),series=len({r['series_id'] for r in accepted}),bulletins=len(coverage),errors=[x for x in coverage if x['status']=='error'],quarantined=len(rejected),generated_at=datetime.now(timezone.utc).isoformat())
    (out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False),flush=True)
    if summary['errors']:raise SystemExit(1)

if __name__=='__main__':main()
