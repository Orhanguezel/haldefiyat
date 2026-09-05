#!/usr/bin/env python3
# Gorunen adlarda Turkce karakter eksigi taramasi. Kullanim:
#   mysql ... --batch --raw -e "SELECT id, slug, name_tr, COALESCE(display_name,'') display_name, COALESCE(aliases,'[]') aliases, canonical_slug, is_active, seo_index, search_volume FROM hf_products" > products.tsv
#   python3 urun-ad-turkce-tarama.py products.tsv fixes.json
# Tuzaklar: str.lower() İ harfini i+U+0307 yapar (tr_lower sart); alias yazim hatalari sozlugu kirletir.
import csv, json, re, sys, collections
rows=list(csv.DictReader(open(sys.argv[1], encoding='utf-8'), delimiter='\t'))
TR=set('çğıöşüÇĞİÖŞÜ')
FOLD=str.maketrans('çğıöşüÇĞİÖŞÜ','cgiosuCGIOSU')
def tr_lower(s): return s.replace('İ','i').replace('I','ı').lower()
def tr_cap(s):
    if not s: return s
    first=s[0]; up={'i':'İ','ı':'I'}.get(first, first.upper())
    return up+s[1:]
def fold(s): return tr_lower(s).translate(FOLD)
def toks(s): return [t for t in re.split(r"[^\w']+", s) if t]
def has_tr(s): return any(c in TR for c in s)

# Sozluk: Turkce karakterli sozcuk -> fold anahtari altinda sayim
vocab=collections.defaultdict(collections.Counter)
ascii_count=collections.Counter()
for r in rows:
    names=[r['name_tr'], r['display_name']]+json.loads(r['aliases'] or '[]')
    for n in names:
        for t in toks(n):
            k=fold(t)
            low=tr_lower(t)
            if has_tr(low): vocab[k][low]+=1      # yalniz İ/I farki olan sozcuk sozluge girmez
            else: ascii_count[k]+=1

def only_i_diff(a,b):
    # yalniz i/ı/İ/I farki mi
    return a.replace('ı','i').replace('İ','i').lower()==b.replace('ı','i').replace('İ','i').lower()

findings=[]
for r in rows:
    shown=r['display_name'] or r['name_tr']
    fixes=[]; ambiguous=[]
    for t in toks(shown):
        if has_tr(t) or len(t)<3: continue
        k=fold(t)
        if k not in vocab: continue
        best,cnt=vocab[k].most_common(1)[0]
        # buyuk/kucuk harf korunsun
        if t.isupper(): sug=best.replace('i','İ').replace('ı','I').upper()
        elif t[0].isupper(): sug=tr_cap(best)
        else: sug=best
        if sug==t: continue
        entry=(t,sug,cnt,ascii_count[k])
        if only_i_diff(t,best): ambiguous.append(entry)   # Ispanak/İspanak tuzagi
        elif cnt>=2 and cnt>=ascii_count[k]: fixes.append(entry)
        else: ambiguous.append(entry)
    if fixes or ambiguous:
        findings.append((r,shown,fixes,ambiguous))

hi=[f for f in findings if f[2]]
print(f"toplam urun {len(rows)} · aday {len(findings)} · yuksek guvenli {len(hi)}")
print("\n=== YUKSEK GUVENLI (display_name duzeltilecek) ===")
out=[]
for r,shown,fixes,amb in sorted(hi,key=lambda f:-int(f[0]['search_volume'])):
    new=shown
    for t,sug,cnt,ac in fixes: new=re.sub(r'\b'+re.escape(t)+r'\b',sug,new)
    tag='master' if r['canonical_slug'] in ('NULL','',None) else 'varyant'
    print(f"  #{r['id']:<6}{r['slug']:32s} {shown!r:40s} -> {new!r:40s} sv={r['search_volume']:>5} {tag}  [{', '.join(f'{t}->{s}({c}/{a})' for t,s,c,a in fixes)}]")
    out.append({"id":int(r['id']),"slug":r['slug'],"old":shown,"new":new})
json.dump(out, open(sys.argv[2],'w',encoding='utf-8'), ensure_ascii=False, indent=1)
print("\n=== BELIRSIZ (elle bak; cogu I/İ farki ya da ASCII bicimi daha yaygin) ===")
for r,shown,fixes,amb in sorted([f for f in findings if f[3] and not f[2]],key=lambda f:-int(f[0]['search_volume']))[:40]:
    print(f"  #{r['id']:<6}{r['slug']:32s} {shown!r:40s} sv={r['search_volume']:>5}  [{', '.join(f'{t}->{s}({c}/{a})' for t,s,c,a in amb)}]")
