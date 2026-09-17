from pathlib import Path
import json,re,html,base64,datetime,csv
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=Path(__file__).parent;root=p.parents[1];g=json.loads((p/'google.json').read_text());a=json.loads((p/'analysis.json').read_text());db=json.loads((p/'db.json').read_text());logs=json.loads((p/'logs.json').read_text());extra=json.loads((p/'google-extra.json').read_text())
f=lambda n,d=0: f'{float(n):,.{d}f}'.replace(',','~').replace('.',',').replace('~','.')
pct=lambda old,new: 100*(new/old-1) if old else None
esc=lambda s:html.escape(str(s))
def table(head,rows):return '<table><thead><tr>'+''.join('<th>'+str(h)+'</th>'for h in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+str(x)+'</td>'for x in r)+'</tr>'for r in rows)+'</tbody></table>'
def para(s,cls=''):return '<p'+(' class="'+cls+'"'if cls else '')+'>'+s+'</p>'
def h2(s):return '<h2>'+s+'</h2>'
def note(s):return para(s,'note')
def ul(ss):return '<ul>'+''.join('<li>'+s+'</li>'for s in ss)+'</ul>'
def page(title,s):return '<section class="report-page"><div class="brandbar"><div class="brand">HaldeFiyat <small>Trafik ve büyüme analizi</small></div><div class="repno">14 Eylül 2026</div></div><h1>'+title+'</h1>'+s+'</section>'
def metric(k):return float(k)
# Source-backed figure, same weekdays and final data only.
daily={r['keys'][0]:r for r in g['daily']['rows']}
oldDates=[(datetime.date(2026,8,30)+datetime.timedelta(days=i)).isoformat()for i in range(7)]
newDates=[(datetime.date(2026,9,6)+datetime.timedelta(days=i)).isoformat()for i in range(7)]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10})
fig,ax=plt.subplots(figsize=(9.1,2.75));ax.plot(range(7),[daily[d]['clicks']for d in oldDates],color='#94a3b8',marker='o',label='30 Ağu–5 Eyl: 5.017');ax.plot(range(7),[daily[d]['clicks']for d in newDates],color='#15803d',marker='o',label='6–12 Eyl: 4.899');ax.set_xticks(range(7),['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']);ax.set_ylabel('Google tıklaması');ax.set_ylim(0,1000);ax.grid(axis='y',alpha=.18);ax.spines[['top','right']].set_visible(False);ax.legend(frameon=False,ncol=2,loc='upper center',bbox_to_anchor=(0.5,1.2));fig.tight_layout();fig.savefig(p/'clicks-weekly.png',dpi=180);plt.close(fig)
img='<img class="chart" alt="Aynı günlerde Google tıklamaları: son haftada özellikle perşembe ve cuma daha düşük." src="data:image/png;base64,'+base64.b64encode((p/'clicks-weekly.png').read_bytes()).decode()+'">'
w=a['weekly'];per=a['period'];pages=[]
s=para('31 Ağustos–13 Eylül 2026 • 19–30 Ağustos raporunun devamı','kicker')
s+=para('<strong>Son haftada küçük, son üç günde daha belirgin bir tıklama düşüşü var. Ancak Ağustos sonuna göre kazanılan büyüme korunuyor.</strong> Genel tabloyu “trafik çöktü” diye okumak doğru değil; kayıp birkaç güçlü sayfada yoğunlaşıyor.')
s+=table(['Kesinleşmiş Google Web verisi','Önceki','Son dönem','Değişim'],[
['13 gün: 18–30 Ağu → 31 Ağu–12 Eyl',f(per['old']['clicks']),f(per['new']['clicks']),'+'+f(per['clickChangePct'],1)+'%'],
['7 gün: 30 Ağu–5 Eyl → 6–12 Eyl',f(w['old']['clicks']),f(w['new']['clicks']),f(w['clickChangePct'],1)+'%'],
['3 gün: 3–5 Eyl → 10–12 Eyl','2.053','1.789','−%12,9']])
s+=h2('Gösterimler azalıyor; site genelinde tıklanma oranı iyileşiyor')
s+=table(['Son 7 gün / önceki 7 gün','Önceki','Son','Fark'],[['Gösterim',f(w['old']['impressions']),f(w['new']['impressions']),'−%4,7'],['CTR',f(w['old']['ctr']*100,2)+'%',f(w['new']['ctr']*100,2)+'%','+0,08 yüzde puan'],['Ortalama pozisyon',f(w['old']['position'],2),f(w['new']['position'],2),'Hafif iyileşme']])
s+=img
s+=para('Tıklama = gösterim × CTR ayrıştırmasında, gösterim kaybı önceki CTR ile yaklaşık <strong>−238 tıklama</strong>; CTR iyileşmesi yeni gösterim hacmiyle yaklaşık <strong>+120 tıklama</strong> etkisi yapıyor. Net fark <strong>−118</strong>. Bu matematiksel ayrıştırmadır; gösterimin neden azaldığını tek başına açıklamaz.')
s+=note('GSC’nin son kesinleşmiş günü 12 Eylül. 13 Eylül’de görünen 559 tıklama hâlâ taze/kısmi; ana karşılaştırmalara alınmadı. Log ve GA4 raporu ise 13 Eylül dâhil 14 tam günü kapsar. Pencereler kaynak bazında açıkça ayrılmıştır.')
pages.append(page('Tıklamalarda %2,4 gerileme var;<br>Ağustos sonuna göre büyüme sürüyor',s))

s=para('Aşağıdaki sayfa ve sorgu karşılaştırmaları 30 Ağustos–5 Eylül ile 6–12 Eylül arasındadır.','dek')
s+=h2('En büyük kayıp İstanbul hal sayfasında')
rows=[]
for r in w['page'][:8]:
 path=r['key'].replace('https://haldefiyat.com','');rows.append([esc(path),f(r['old']['clicks'])+' → '+f(r['new']['clicks']),f(r['delta']),f(pct(r['old']['impressions'],r['new']['impressions']),1)+'%',f(r['old']['position'],2)+' → '+f(r['new']['position'],2)])
s+=table(['Sayfa','Tıklama','Fark','Gösterim Δ','Pozisyon'],rows)
s+=para('İstanbul’daki <strong>−166 tıklama</strong>, tek başına site net kaybından büyük; çünkü Ankara hal sayfasındaki <strong>+119</strong> ve yeni sayfalardaki kazanımlar kaybı dengeliyor. Kahramanmaraş’ta gösterim azalırken ortalama pozisyon iyileşmiş. Bu nedenle tüm kaybı sıralama düşüşü olarak sınıflandırmak doğru olmaz.')
s+=h2('Bölümler: yeni şehir–ürün ve analiz sayfaları denge sağlıyor')
s+=table(['Bölüm','Önceki tıklama','Son tıklama','Fark'],[[('/'if k=='ana sayfa'else '/'+k+'/*'),f(w['sections'][k]['oldClicks']),f(w['sections'][k]['newClicks']),f(w['sections'][k]['newClicks']-w['sections'][k]['oldClicks'])]for k in ['urun','hal','firmalar','ana sayfa','fiyat','analiz','piyasa']])
s+=h2('Sorgu düzeyinde müdahale edilecek yerler')
s+=table(['Sorgu','Tıklama','CTR','Pozisyon'],[[esc(r['key']),f(r['old']['clicks'])+' → '+f(r['new']['clicks']),f(r['old']['ctr']*100,2)+'% → '+f(r['new']['ctr']*100,2)+'%',f(r['old']['position'],2)+' → '+f(r['new']['position'],2)]for r in w['query'][:5]])
s+=para('“İstanbul hal fiyatları” sorgusunda hem sıralama hem CTR geriliyor; buna karşılık “Adana mayer limon fiyatları” sorgusunda pozisyon iyileşirken tıklama düşüyor. Başlık, arama sonucu görünümü ve ilgili sayfalar arasındaki dağılım sorgu bazında incelenmeli. <strong>Mevsimsellik ve rakip etkisi bu verilerle kanıtlanmış değil.</strong>')
s+=note('Sayfa gruplaması 5.081 → 4.974 tıklama (−107), mülk toplamı 5.017 → 4.899 (−118) verir. GSC’nin sayfa/mülk toplulaştırma kuralları farklıdır; sayfa toplamı mülk toplamına zorlanmadı. Görünür sorgular tıklamaların yalnız %52,5 → %50,7’sini kapsıyor; gizlenen sorgular nedeniyle sorgu kayıpları eksiksiz dağılım değildir.')
pages.append(page('Kayıp birkaç güçlü sayfada yoğunlaşıyor',s))

cur=a['logs']['current']['counts'];prev=a['logs']['previous']['counts'];s=para('Log kıyası: 17–30 Ağustos → 31 Ağustos–13 Eylül; her iki pencere 14 gün.','dek')
s+=table(['Log metriği','Önceki 14 gün','Son 14 gün','Değişim'],[[label,f(prev[k]),f(cur[k]),('+'if pct(prev[k],cur[k])>=0 else '')+f(pct(prev[k],cur[k]),1)+'%']for label,k in [('Toplam HTTP isteği','total'),('Bot işareti taşımayan istek','nonbot'),('RSC olmayan, HTTP 200 sayfa isteği','non_rsc_200'),('Google referrer’lı HTTP 200 sayfa isteği','google_ref_200'),('Başarılı pageview POST isteği','beacon_success')]])
s+=para('İki haftalık toplamlar büyüyor. Son iki tam log haftasında ise başarılı pageview isteği <strong>11.322 → 10.801 (−%4,6)</strong>; Google referrer’lı sayfa isteği <strong>9.957 → 11.109 (+%11,6)</strong>. Bu sayaçlar farklı olayları ve zaman dilimlerini ölçtüğü için arama tıklamalarıyla birebir eşleşmez.')
s+=h2('Günlük görünüm')
rr=[]
for day,v in logs['daily'].items():
 if day<'2026-08-31':continue
 gc=f(daily[day]['clicks'])if day in daily else '559*'
 rr.append([day[8:]+('/08'if day[5:7]=='08'else '/09'),f(v['nonbot']),f(v.get('beacon_success',0)),f(v.get('google_ref_200',0)),gc])
s+=table(['Gün','Bot dışı istek','Pageview POST 2xx','Google referrer 200','GSC tıklama'],rr)
s+=para('Bot işareti taşımayan isteklerin %75,7’si mobil; GSC son hafta tıklamalarının %91,0’ı mobil. Googlebot 16.143 → 18.469 istek (+%14,4); GPTBot + OAI-SearchBot + ClaudeBot toplamı 4.199 → 6.980 (+%66,2). Bunlar kullanıcı veya yönlendirme trafiği değildir. gclid taşıyan yalnız 2 istek var; reklam platformu okunmadığı için kampanyanın açık/kapalı olduğu sonucu çıkarılmadı.')
s+=h2('RSC isteği, tek başına ziyaret veya prefetch demek değil')
s+=para('Son dönemde sayfa yolu isteklerinin <strong>%90,3’ünde <code>_rsc</code> parametresi</strong> bulunuyor. Önceki rapor bunların tamamını “kullanıcının görmediği prefetch” olarak adlandırmıştı. Erişim logu bu ayrımı kanıtlamaz: RSC isteği istemci tarafı gezinmeden de gelebilir. RSC olmayan 200 yanıtları da doğrulanmış insan ziyareti veya oturum değildir; otomasyon, tekrar yükleme ve referrer tekrarları içerebilir.')
s+=note('*13 Eylül GSC değeri kısmi bilgi olarak gösterildi. Kullanıcı aracına göre bot süzme yaklaşık bir sınıflandırmadır. Pageview sayısı başarılı POST isteklerini sayar; tekil kişi değildir. IP adresleri rapora ve veri çıktısına alınmadı.')
pages.append(page('Site trafiği iki haftada büyüdü;<br>son haftanın pageview sayacı yavaşladı',s))

s=para('Canlı durum 14 Eylül’de; dönem hataları 31 Ağustos–13 Eylül loglarından kontrol edildi.','dek')
s+=h2('Kayıp sayfalarında toplu indeks kaybı saptanmadı')
s+=para('İstanbul, Kahramanmaraş, kuru soğan, salçalık domates ve patates sayfalarının beşi de URL Inspection’da <strong>PASS / dizine eklendi</strong>. Google canonical ile sayfanın canonical adresi eşleşiyor; son taramalar 14 Eylül, fetch başarılı. Canlı sayfalar HTTP 200 ve index/follow. Bu bulgu bu beş sayfa içindir; bütün site için sıralama veya ceza denetimi değildir.')
s+=h2('404’lerin ağırlık merkezi eski CSS dosyalarına kaymış')
s+=table(['HTTP göstergesi','17–30 Ağu','31 Ağu–13 Eyl'],[['404',f(prev.get('status_404',0)),f(cur.get('status_404',0))],['5xx',f(sum(prev.get('status_'+str(c),0)for c in range(500,600))),f(sum(cur.get('status_'+str(c),0)for c in range(500,600)))],['401',f(prev.get('status_401',0)),f(cur.get('status_401',0))],['429',f(prev.get('status_429',0)),f(cur.get('status_429',0))],['413',f(prev.get('status_413',0)),f(cur.get('status_413',0))]])
s+=para('Üç eski CSS yolu <strong>4.620 adet 404</strong> üretiyor; dönem 404’lerinin <strong>%46,6’sı</strong>. Üçü de bugün 404. Güncel HTML’nin çağırdığı iki yeni CSS dosyası ise 200 dönüyor. Bulgular eski sayfa/asset sürümlerinin istenmeye devam ettiğini gösteriyor; bu isteklerin gerçek kullanıcı etkisi ve cache/deploy kaynak zinciri ayrıca doğrulanmalı.')
s+=table(['Eski CSS dosyası','Dönem 404'],[['1jvrn-slpfpj7.css','2.003'],['3tfwshwg68odk.css','1.994'],['0t9fsotkcm7ew.css','623']])
s+=para('Dönem 5xx toplamı <strong>799 (%0,053)</strong>. Bunların 644’ü ilk haftada, 155’i ikinci haftada; ikinci haftada hata hacmi azalıyor. Bu yön, son tıklama düşüşünü genel sunucu kesintisiyle açıklamayı desteklemiyor. Ancak toplam düşük oran, belirli kullanıcı akışlarındaki hataları önemsiz kılmaz.')
s+=para('401 yanıtlarının 5.438’i oturum açılışı/yenileme uçlarında; 429 yanıtlarının 682’si fiyat dışa aktarımında, 768’i üç ürün geçmişi ucunda. Bunlar ayrı akış kontrolleri gerektirir; her 401 yanıtı başarısız kullanıcı girişi değildir. <code>/api/revalidate</code> için 429 adet 404 de cache yenileme yolunun incelenmesini gerektiriyor; bu çağrıların içerik tazeliğine etkisi doğrulanmadı.')
s+=h2('Önceki teknik bulguların canlı karşılığı')
s+=ul(['<strong>Eski slug yönlendirmeleri çalışıyor:</strong> <code>/urun/elma-2</code> → 301; eski firma örneği → 308; ikisi de doğru kanonik sayfada 200 ile bitiyor.', '<strong>Firma parametre sayfası:</strong> <code>/firmalar?city=bursa&amp;page=2</code>, Bursa liste sayfasına canonical ve noindex/follow içeriyor.', '<strong>Sitemap:</strong> 860 web URL’si bildirilmiş; GSC’de 0 hata, 0 uyarı; 14 Eylül’de indirilmiş. API’deki “indexed=0” alanı sitenin indekslenmediği şeklinde okunmadı.', '<strong>Veri tazeliği:</strong> Kahramanmaraş sayfası hâlâ “Son Liste 7 Eylül” başlığı taşıyor; bu, günlük fiyat arayan kullanıcı için incelenmesi gereken somut bir içerik açığı.'])
s+=note('PageSpeed Insights mobil ve masaüstü çağrıları günlük kota nedeniyle HTTP 429 verdi. Eski 91/100 hız puanı güncelmiş gibi tekrarlanmadı. İstanbul sayfasının tek HTTP indirme ölçümü yaklaşık 4,0 sn; bu değer Lighthouse/CrUX veya TTFB ölçümü değildir.')
pages.append(page('İndeksler yerinde; eski CSS istekleri ve veri tazeliği açık',s))

s=para('GA4 ve iş verisi kıyası: 17–30 Ağustos → 31 Ağustos–13 Eylül; 14’er gün.','dek')
def ga(name):return dict(zip([r['name']for r in g['ga4'][name]['data']['metricHeaders']],[float(r['value'])for r in g['ga4'][name]['data']['rows'][0]['metricValues']]))
G0=ga('previous');G1=ga('current')
s+=h2('GA4’te erişim ve etkileşim artıyor')
s+=table(['GA4 metriği','Önceki','Son','Değişim'],[[label,f(G0[k],1 if k=='averageSessionDuration'else 0),f(G1[k],1 if k=='averageSessionDuration'else 0),'+'+f(pct(G0[k],G1[k]),1)+'%']for label,k in [('Oturum','sessions'),('Etkin kullanıcı','activeUsers'),('Yeni kullanıcı','newUsers'),('Sayfa görüntüleme','screenPageViews'),('Ort. oturum süresi (sn)','averageSessionDuration'),('Anahtar olay','keyEvents')]]+[['Etkileşim oranı',f(G0['engagementRate']*100,2)+'%',f(G1['engagementRate']*100,2)+'%','+4,60 yüzde puan']])
s+=para('Organik arama oturumları 925 → 1.086; AI Assistant kanalı 11 → 20 oturum. <strong>30 form_submit olayı</strong> ölçülmüş; bu sayı doğrulanmış 30 müşteri veya satış değildir. GA4 sayfa görüntüleme 3.618, logdaki başarılı pageview POST sayısı 22.123: kapsamlar arasında büyük fark sürüyor. Çerez onayı ve ölçüm koşullarının etkisi ayrıştırılmadan bunu sabit bir “yakalama oranı” olarak kullanmamak gerekir.')
s+=h2('Yeni üyeler ve ilanlar var; reklam tahsilatı yok')
D0=db['periods']['previous'];D1=db['periods']['current'];nr=lambda d,k:int(d[k][0]['n'])
s+=table(['İş metriği','Önceki','Son'],[['Yeni üye',f(nr(D0,'users')),f(nr(D1,'users'))],['Yeni bülten abonesi',f(nr(D0,'newsletter')),f(nr(D1,'newsletter'))],['Banner gösterimi',f(D0['banners'][0]['impressions']),f(D1['banners'][0]['impressions'])],['Banner tıklaması',f(D0['banners'][0]['clicks']),f(D1['banners'][0]['clicks'])],['Banner CTR','%0,112','%0,086'],['Reklam ödeme defterinde tahsilat','0 kayıt','0 kayıt'],['Firma sahiplenme talebi','0','0'],['Yeni ilan','0','11'],['İlan soru/teklif kaydı','0','2'],['İlan aranma talebi','0','0'],['Dönemde yayımlanan analiz',str(len(D0['articles'])),str(len(D1['articles']))]])
s+=para('14 Eylül anlık durumunda <strong>5 onaylı ve süresi dolmamış ilan</strong> var; önceki rapordaki “aktif ilan yok” bulgusu artık geçerli değil. Reklam ödeme defterinde dönem tahsilatı bulunmadı; bu tespit tüm banka hareketleri veya bütün ürün gelirlerinin muhasebe mutabakatı değildir.')
s+=h2('Bülten ve arama hunisi')
s+=para('Bülten CTA gösterimleri 723 → 813; başarılı form olayları 5 → 2 (%0,69 → %0,25 olay oranı). Yeni abone sayısı 4 → 1. Form başarısı ile yeni abone aynı şey değildir; mevcut abone tekrar gönderebilir. Ürün aramasında fiyat görüntüleme 610 → 841 olay; gönderim 392 → 313; sıfır sonuç 116 → 83 (%29,6 → %26,5). Bunlar oturum bazlı bağlı huni değil, olay toplamlarının oranıdır.')
s+=note('GTM-K3WDGHX5 canlı sürüm 2; tek GA4 Google Tag ve 0 özel trigger. Konteynerin durumu canlı API ile kontrol edildi. Ölçüm kimliklerinin olması, her ziyaretin GA4’e ulaşmasını veya her form olayının ticari dönüşüm olmasını garanti etmez.')
pages.append(page('Davranış göstergeleri iyileşti;<br>bülten ve gelir dönüşümü zayıf kaldı',s))

s=para('Veri sağlığı ve katalog: canlı veritabanı yeniden okundu; geçmiş değerler de aynı sorguyla hesaplandı.','dek')
s+=h2('Kaynak kapsamı genişliyor, kısmi çalışmalara dikkat')
def et(d,st):return next(r for r in d['etl']if r['status']==st)
s+=table(['Veri metriği','17–30 Ağu','31 Ağu–13 Eyl'],[['ETL çalışması',f(sum(r['n']for r in D0['etl'])),f(sum(r['n']for r in D1['etl']))],['Hata',f(et(D0,'error')['n']),f(et(D1,'error')['n'])],['Kısmi çalışma',f(et(D0,'partial')['n']),f(et(D1,'partial')['n'])],['OK ama fetched=0',f(et(D0,'ok')['empty_fetch']),f(et(D1,'ok')['empty_fetch'])],['Fiyat tarihi döneme giren satır',f(D0['prices'][0]['n']),f(D1['prices'][0]['n'])],['Veri üreten ayrı hal/borsa',f(D0['prices'][0]['markets']),f(D1['prices'][0]['markets'])],['Orta noktadan türetilmiş ortalama payı','%72,2','%78,5'],['Yeni karantina kaydı',f(sum(r['n']for r in D0['quarantine'])),f(sum(r['n']for r in D1['quarantine']))]])
s+=para('943 ETL çalışmasının 316’sı kısmi (<strong>%33,5</strong>), 11’i hata (%1,2). “OK” olup sıfır satır çeken çalışma sayısı 202’den 118’e inmiş; tek başına hata sayısını izlemek hâlâ eksik bir resim verir. Bununla birlikte kaynak takvimi, yapılandırma ve kapatılmış kaynaklar kontrol edilmeden her sıfır satır koşusu arıza ilan edilmemeli.')
s+=h2('Kaynak bazında somut takip noktaları')
s+=table(['Kaynak / sayfa','Veritabanındaki son tarih','Yorum'],[['Kahramanmaraş resmî','7 Eylül 2026','Canlı başlık da aynı; tıklama kaybıyla birlikte öncelikli'],['Tekirdağ resmî','1 Ağustos 2026','Eski rapordaki tazelik açığı sürüyor'],['Çorum resmî','12 Ağustos 2026','Güncel kaynak/alternatif akış teyidi gerekli'],['Antkomder üç kaynak','Dönemde toplam 74 OK/boş koşu','Kaynak kapısı ve beklenen çalışma durumu incelenmeli']])
s+=para('Karantina girişleri: kaynak medyanından sapma 317, önceki fiyattan sıçrama 183, eş kaynak medyanından sapma 75, ürün–birim uyumsuzluğu 27; toplam <strong>602</strong>. Bu, kuralların şüpheli veriyi yakaladığını gösterir; her kaydın gerçek fiyat hatası olduğunu kanıtlamaz.')
s+=h2('Katalog ve analiz yayını')
s+=para('Katalogda 1.250 ürün kaydı, SEO indeksine açık 249 ürün bulunuyor. Bunlar benzersiz ticari ürün veya fotoğraf sayısı değildir. Önceki raporun 243 SEO ürününe göre kapsam genişlemiş. Bu çalışmada fotoğraf manifestinin kapsamı yeniden sayılmadı; eski 420 fotoğraflı slug değeri güncel kabul edilmedi.')
s+=para('Dönemde 5 analiz yayımlandı. Arama tıklamaları /analiz bölümünde son haftada <strong>63 → 116 (+%84,1)</strong>; CTR %1,23 → %1,99. Önceki rapordaki “analizler gösteriliyor ama tıklanmıyor” sorunu iyileşiyor, tamamen kapanmış değil. Az önce düzenlenen <strong>36 numaralı 7–13 Eylül analizi taslak</strong> durumda; henüz yayın trafiği üretmesi beklenmez.')
s+=note('ETL çalışma toplamları, fiyat tarihi üzerinden satır sayısı ve karantina girişleri farklı tanelerdeki metriklerdir; birbirine eşit olmak zorunda değildir. Backfill/düzeltmeler geçmiş satır sayılarını değiştirebilir. Bu nedenle önceki PDF’nin donmuş sayıları yerine aynı tarihler yeniden sorgulandı.')
pages.append(page('Veri kapsamı arttı;<br>güncellik ve kalite sınırları sürüyor',s))

s=h2('Önceki raporun aksiyonlarına güncel durum')
s+=table(['Önceki başlık','14 Eylül durumu / kanıt'],[['Eski −2 slug yönlendirmeleri','İki örnekte 301/308 → doğru kanonik 200; bu örnekler kapandı.'],['Firma parametre canonical','Bursa örneğinde canonical + noindex doğrulandı.'],['RSC / prefetch yükü','RSC payı %90,3; oran tek başına prefetch hacmini kanıtlamaz.'],['Dağıtım kesintileri','5xx ikinci haftada azaldı; eski CSS 404’leri ayrı açık.'],['Analiz başlıkları','Son haftada +53 tıklama; yeni rapor 36 taslakta.'],['Şehir–ürün sayfaları','/fiyat/* yeni dönemde 159 tıklama; kapsamın katkısı var.'],['Bülten dönüşümü','1 yeni abone; olay bazlı başarı oranı %0,25, açık.'],['Aktif ilan boşluğu','5 onaylı/süresi dolmamış ilan; artık boş değil.'],['Reklam geliri','Reklam tahsilat defterinde 0 dönem kaydı; ticari açık.'],['Sessiz ETL / bayat kaynak','OK/boş koşu azaldı; Tekirdağ ve Kahramanmaraş tazeliği açık.'],['Hız / TTFB','PSI kota engeli nedeniyle yeni laboratuvar sonucu yok.']])
s+=h2('Öncelikli devam işleri')
s+=ul(['<strong>İstanbul sorgu kaybı:</strong> “İstanbul hal fiyatları” için başlık/snippet ve sorgu–sayfa dağılımını birlikte incele; mevcut sıralama ve CTR kaybını ayrı izle. Geneli etkileyen başlık değişikliği yapmadan önce bu sayfada somut düzeltme taslağı hazırla.', '<strong>CSS sürüm sürekliliği:</strong> En sık istenen üç eski dosyanın hangi sayfa/cache sürümünden geldiğini log referrer ve release dizinleriyle eşleştir. Gerekli eski asset’lerin tutulması veya cache geçişi için dar kapsamlı düzeltme hazırla.', '<strong>Kahramanmaraş tazeliği:</strong> Resmî bültenin tarihi ile ETL’nin son kaydını karşılaştır; güncel kaynak varsa içeriğin geride kalma nedenini gider. Kaynak güncellenmediyse “bugün” izlenimi verme.', '<strong>Bülten ve gelir:</strong> Bültenin 813 gösterimden yalnız 1 yeni abone üretmesini form hata/tekrar kayıt ayrımıyla incele. Reklam satış takibi, gösterim artışından ayrı yönetilmeli.'])
s+=h2('Kaynaklar ve karşılaştırmanın sınırları')
s+=para('Kaynaklar: GSC API <code>sc-domain:haldefiyat.com</code>, Web araması, <code>dataState=final</code>; GA4 property 538279658, yalnız haldefiyat.com/www hostları; GTM canlı sürüm API’si; VPS dedike Nginx logları; HaldeFiyat MySQL salt okuma; beş URL Inspection sorgusu; canlı HTTP kontrolleri. Ham yanıtlar, SQL ve hesaplama kodu raporla birlikte yerel kanıt dizininde tutuldu.')
s+=para('GSC günleri America/Los_Angeles, GA4 Europe/Istanbul, Nginx/DB dönem sınırları UTC’dir. Kaynakların toplamları birleştirilmedi. GSC pozisyonu gösterim ağırlıklıdır; görünürlük ve sorgu bileşimi değişimi tek başına algoritma/rekabet/mevsim etkisini kanıtlamaz. Ana 7 günlük kıyas aynı haftanın günlerini karşılaştırır.')
s+=para('19–30 Ağustos GSC toplamı artık kesinleşmiş veride <strong>6.757</strong>; önceki PDF’deki 6.350 taze/kısmi değerdi. Aynı dönem log ve GA4 sayıları da yeniden hesaplama, güncel filtreler ve sonradan gelen kayıtlar nedeniyle eski PDF ile birebir uyuşmuyor. Eski belge değiştirilmedi; devam raporunda güncel hesaplar ve tanımlar kullanıldı.')
s+=para('API yöntem referansı: <a href="https://developers.google.com/webmaster-tools/v1/searchanalytics/query">Google Search Analytics: query</a>. Rapor hazırlama sırasında site içeriği, SEO ayarı, kampanya, yayın durumu veya veritabanı değiştirilmedi.')
pages.append(page('Öncelik: İstanbul kaybı, CSS sürekliliği<br>ve güncel fiyat verisi',s))
css=re.search(r'<style>(.*?)</style>',(root/'reports/analiz-19-30-agustos-2026.html').read_text(),re.S).group(1).replace('19–30 Ağustos 2026','31 Ağustos–13 Eylül 2026')
css+='\nbody{line-height:1.5}td{padding:3.5px 7px}th{padding:4px 7px}h2{margin:12px 0 5px}p{margin-bottom:7px}.report-page{break-before:page}.report-page:first-child{break-before:auto}.chart{width:100%;height:auto;margin:5px 0}body{font-size:10.1px}td{overflow-wrap:anywhere}h1{font-size:20px}a{color:#166534} @media screen{body{max-width:900px;margin:24px auto;padding:20px}.report-page{margin-bottom:50px}}'
doc='<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>HaldeFiyat · 31 Ağustos–13 Eylül 2026 Trafik Analizi</title><style>'+css+'</style></head><body>'+''.join(pages)+'</body></html>'
(root/'reports/analiz-31-agustos-13-eylul-2026.html').write_text(doc)
# Inspectable exports, private aggregate rows only.
for dim in ['page','query']:
 with(p/(dim+'-weekly-change.csv')).open('w')as file:
  wr=csv.writer(file);wr.writerow([dim,'previous_clicks','current_clicks','delta','previous_impressions','current_impressions','previous_position','current_position'])
  for r in w[dim]:wr.writerow([r['key'],r['old']['clicks'],r['new']['clicks'],r['delta'],r['old']['impressions'],r['new']['impressions'],r['old']['position'],r['new']['position']])
with(p/'gsc-daily.csv').open('w')as file:
 wr=csv.writer(file);wr.writerow(['date','clicks','impressions','ctr','position','state']);
 for r in g['daily']['rows']:wr.writerow([r['keys'][0],r['clicks'],r['impressions'],r['ctr'],r['position'],'final'])
print('report pages',len(pages),'html bytes',len(doc))
