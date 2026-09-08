"""Source-preserving ITB registration extract; no averaging across types/sale codes."""
import re,json,hashlib,csv,sys,urllib.request,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
RAW=ROOT/'artifacts/seo-intent-2026-09-08/raw'
num=lambda s:float(s.replace('.','').replace(',','.'))
def parse(text,date,url):
    if f'TARİH : {date[8:10]}.{date[5:7]}.{date[:4]}' not in text: raise ValueError('Document date mismatch')
    records=[]; rejected=[]
    for line in text.splitlines():
        if not re.search(r'Çek\.siz Kuru Üzüm|Kekik',line) or 'Toplam' in line: continue
        m=re.match(r'^\s*(.*?)\s{2,}(\d+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+Kg\s+([\d.,]+)\s*([A-ZŞ.]+)\s*$',line)
        if not m: rejected.append({'date':date,'line':line,'reason':'unparsed'});continue
        label,count,lo,hi,avg,qty,value,sale=m.groups(); lo,hi,avg,qty,value=map(num,(lo,hi,avg,qty,value))
        if not(0<lo<=avg<=hi and qty>0) or sale=='F.F':
            rejected.append({'date':date,'line':line,'reason':'no positive comparable price'});continue
        records.append(dict(product='kuru-uzum' if 'Kuru Üzüm' in label else 'kekik',date=date,label=label,sale=sale,unit='kg',min=lo,max=hi,average=avg,quantity=qty,value=value,transactions=int(count),sourceUrl=url))
    return records,rejected
if __name__=='__main__':
    if '--download' in sys.argv:
        RAW.mkdir(parents=True,exist_ok=True)
        listing=urllib.request.urlopen('https://itb.org.tr/GunlukBultenler/1-tescil-bulteni',timeout=30).read().decode()
        files=sorted({f for f in re.findall(r'[0-9]{8}-tescil-bulteni-1\.pdf',listing) if f[:8]<='20260908'},reverse=True)[:15]
        if len(files)!=15:raise ValueError('Expected 15 official bulletin links')
        for file in files:
            target=RAW/file
            if not target.exists():urllib.request.urlretrieve('https://itb.org.tr/dosya/bulten/'+file,target)
            subprocess.run(['pdftotext','-layout',str(target),str(target.with_suffix('.txt'))],check=True)
    rows=[]; rejected=[];docs=[]
    for f in sorted(RAW.glob('*-tescil-bulteni-1.txt')):
        d=f.name[:8];date=f'{d[:4]}-{d[4:6]}-{d[6:]}';url='https://itb.org.tr/dosya/bulten/'+f.with_suffix('.pdf').name
        r,q=parse(f.read_text(),date,url);rows+=r;rejected+=q
        docs.append(dict(date=date,url=url,sha256=hashlib.sha256(f.with_suffix('.pdf').read_bytes()).hexdigest(),rows=len(r)))
    payload=dict(checkedAt='2026-09-08',source='İzmir Ticaret Borsası günlük tescil bültenleri',documents=docs,rows=rows)
    (ROOT/'frontend/src/data/itb-specialty.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    (RAW.parent/'itb-rejected.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=2))
    dst=ROOT/'frontend/public/data';dst.mkdir(exist_ok=True)
    with (dst/'itb-kuru-uzum-kekik-2026-09-08.csv').open('w') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator="\n");w.writeheader();w.writerows(rows)
    print(json.dumps({'documents':len(docs),'records':len(rows),'excluded':len(rejected)}))
