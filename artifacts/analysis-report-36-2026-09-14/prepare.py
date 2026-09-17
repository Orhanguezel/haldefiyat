import json
import re
from pathlib import Path

root = Path(__file__).parent
before = json.loads((root / 'before.json').read_text())
tables = re.findall(r'<div class="overflow-x">.*?</div>', before['content'], re.S)
assert len(tables) == 3
for i in (1, 2):
    tables[i] = tables[i].replace('Hafta başı', 'Başlangıç (TL/kg)').replace('Hafta sonu', 'Bitiş (TL/kg)').replace('>Hal<', '>Hal sayısı*<').replace(' ₺', '')
content = '''<p class="kicker">Haftalık Hal Raporu · 7–13 Eylül 2026</p>
<p class="dek">HaldeFiyat Endeksi önceki haftaya göre <strong>%1,2 artarak 71,82 puana</strong> yükseldi. Buna karşılık, hafta içi fiyat hareketi ölçülen 71 ürünün 46’sında gerileme görüldü. Kapya biberdeki düşüş ile beyaz incir ve nardaki yükseliş, haftanın öne çıkan ayrışması oldu.</p>
<div class="meta"><span><strong>Dönem:</strong> 7–13 Eylül 2026</span><span><strong>Veri kapsamı:</strong> 10.613 fiyat gözlemi, 39 hal ve borsa</span><span><strong>Hareket ölçümü:</strong> Ölçütleri karşılayan 71 ürün</span></div>

<h2>Endeks yükselirken ürünlerin çoğu neden geriledi?</h2>
<p>Endeks 70,96 puandan 71,82 puana çıktı; sepet ortalaması 39,45 TL/kg’dan 39,94 TL/kg’a yükseldi. Bu rakamlar, seçili ürünlerin <strong>tam hafta ortalamalarının önceki haftayla karşılaştırmasını</strong> gösteriyor. Ürün hareketleri ise daha geniş bir grupta, aynı haftanın başlangıç ve bitiş gözlem pencerelerini karşılaştırıyor. Ürün kapsamı, hesaplama yöntemi ve karşılaştırma aralığı farklı olduğu için iki göstergenin yönü aynı olmak zorunda değil.</p>
<p>Bu haftanın dengeli okuması şu: Endeks sepeti önceki haftaya göre yükselirken, ölçülen ürünlerin çoğunda hafta içinde fiyatlar geriledi. Buradan bütün sebze ve meyvelerin pahalandığı sonucu çıkarılamaz.</p>
''' + tables[0] + '''
<p class="note"><strong>Sepet kapsamı:</strong> Endeksin tanımlı listesinde 15 ürün var; bu hafta ve önceki hafta hesaplamaya 14 ürün girdi. 10–16 Ağustos haftasında bu sayı 15’ti. Dolayısıyla tablodaki uzun dönem hareketlerini tamamen aynı kapsamlı bir sepet karşılaştırması olarak okumamak gerekir. Sepet ortalaması bir alışveriş sepetinin toplam maliyeti değildir.</p>

<h2>Kapya biberde belirgin gerileme</h2>
<p>Kapya biberin haller arası medyan fiyatı 46,88 TL/kg’dan 32,50 TL/kg’a indi; değişim <strong>−%30,7</strong> oldu. Kiraz, kayısı, cherry domates ve beyaz üzüm de tabloda öne çıkan düşüşler arasında yer aldı. Bu değerler, her ürünün gözlem pencerelerindeki hal ortalamalarından hesaplanan göstergelerdir; belirli bir satıcının teklifi değildir.</p>
''' + tables[1] + '''

<h2>Beyaz incir ve nar ters yönde hareket etti</h2>
<p>Beyaz incirde medyan fiyat 88,75 TL/kg’dan 140,00 TL/kg’a çıkarak <strong>%57,8</strong> yükseldi. Narda artış <strong>%31,9</strong>, bitiş seviyesi 112,08 TL/kg oldu. Mandalina ve kilogram bazlı avokado da yükseliş gösterdi.</p>
''' + tables[2] + '''
<p class="note"><strong>*Hal sayısı nasıl okunmalı?</strong> Sütun, başlangıç ve bitiş pencerelerindeki ayrı hal sayılarının küçük olanıdır. İki pencerede aynı hallerin bulunduğunu veya tüm hallerde fiyatın aynı yönde değiştiğini göstermez. Örneğin beyaz incirdeki “7” değeri, yedi halin tamamında yükseliş yaşandığı anlamına gelmez. Kaynak bileşimi değişebildiği için bu sonuçlar eşleşmiş sabit hal grubunun fiyat değişimi olarak yorumlanmamalıdır.</p>
<p>Beyaz incir ve narın gözlem tabanı sınırlı. Fiyat hareketinin arz, kalite, ürün çeşidi veya talep kaynaklı olup olmadığını bu kayıtlar tek başına açıklamıyor. Ülke geneline ilişkin bir sonuç ya da gelecek haftaya yönelik fiyat tahmini için ek kanıt gerekir.</p>

<h2>71 ürünün 46’sında düşüş</h2>
<p>Hareket ölçütlerini karşılayan <strong>71 ürünün 20’si yükseldi, 46’sı geriledi, 5’i yatay kaldı</strong>. Ürün bazlı değişimlerin medyanı <strong>−%3,4</strong> oldu. Böylece düşüş, bu gözlem kümesindeki ürünlerin yaklaşık üçte ikisinde görüldü. Bu oran, Türkiye’de satılan tüm ürünlerin veya işlem hacminin üçte ikisi anlamına gelmiyor; her ürün yön hesabında bir kez sayılıyor.</p>

<h2>14–20 Eylül haftasında izlenecek başlıklar</h2>
<ul>
<li><strong>Endeks:</strong> 71,82 puandan sonraki yön değerlendirilirken hesaplamaya giren ürün sayısı ve kapsamı birlikte kontrol edilmeli.</li>
<li><strong>Beyaz incir:</strong> 140,00 TL/kg seviyesinin sonraki gözlem penceresinde korunup korunmadığı ve fiyatı bildirilen hallerin değişip değişmediği izlenmeli.</li>
<li><strong>Nar:</strong> 112,08 TL/kg seviyesindeki hareketin yeni kayıtlarda sürüp sürmediği, mümkün olduğunca aynı haller karşılaştırılarak değerlendirilmeli.</li>
<li><strong>Cherry domates:</strong> 45,00 TL/kg seviyesiyle birlikte gözlem tabanının genişliği izlenmeli. Hal sayısının artması tek başına ülke genelini temsil ettiği anlamına gelmez.</li>
</ul>
<p>Alım-satım değerlendirmelerinde bu göstergeler, ilgili halin güncel fiyatı ve ürünün kalite, ambalaj ve teslim koşullarıyla birlikte okunmalı. HaldeFiyat’ın günlük fiyat tabloları ve ürün detay grafikleri yerel karşılaştırmanın başlangıç noktasıdır.</p>

<h2>Veri kaynağı ve yöntem</h2>
<p>Rapor, HaldeFiyat veri tabanında 7–13 Eylül 2026 dönemi için bulunan, dışlanan güvensiz kaynak-tarih aralıkları çıkarıldıktan sonra kalan <strong>10.613 fiyat gözlemine ve 39 hal/borsa kaynağına</strong> dayanır. Sayılar 14 Eylül 2026’da yeniden hesaplanarak kontrol edildi. Bu toplam kapsamın tamamı ürün hareketi hesabına girmez.</p>
<p>Hareket hesabında aynı ürünün kanonik başlık altında birleştirilen yazımları kullanılır. Kilogram bazlı kayıtlarda, veri bulunan ilk iki gün ile son iki gündeki her halin ortalama fiyatı alınır; ardından her pencere için haller arası medyan hesaplanır. Her iki pencerede de en az altı hal bulunması gerekir. Hallerin iki pencerede birebir aynı olması şartı uygulanmaz. Mutlak değişimi %80’i aşan kalemler ile balık, et, canlı hayvan, hububat ve bakliyat kategorileri hareket ölçümünden çıkarılır. Yüzdeler yuvarlanmamış değerlerden hesaplanır.</p>
<p>Endeks, tanımlı temel ürün listesindeki kullanılabilir kilogram fiyatlarını tam hafta üzerinden hesaplar; ürün bazında uç pazar değerlerini süzdükten sonra ürün ortalamalarının aritmetik ortalamasını alır. Baz dönem 11–17 Mayıs 2026’dır. Endeks ve ürün hareketleri satış miktarıyla ağırlıklandırılmaz; perakende fiyatını veya tüketici enflasyonunu ölçmez.</p>
<p class="note"><strong>Görsel:</strong> Kapya biber, beyaz incir ve nar içeren kapak yapay zekâ ile oluşturulmuş temsili bir hal sahnesidir; belirli bir halin veya günün fotoğrafı değildir.</p>'''
patch = {
    'title': '7–13 Eylül Hal Raporu: Endeks Yükseldi, 46 Üründe Fiyat Geriledi',
    'summary': '7–13 Eylül 2026’da HaldeFiyat Endeksi %1,2 yükselirken hafta içi karşılaştırmada 71 ürünün 46’sı geriledi. Kapya biberde düşüş, beyaz incir ve narda yükseliş öne çıktı.',
    'meta_title': '7–13 Eylül 2026 Hal Raporu: Kapya, İncir ve Endeks',
    'meta_description': '7–13 Eylül 2026 hal fiyatları: Endeks 71,82 puana çıktı; 71 ürünün 46’sı geriledi. Kapya, beyaz incir ve narın fiyat hareketleri ve veri kapsamı.',
    'og_image': '/uploads/analysis-covers/2026-09-14/hal-raporu-7-13-eylul-2026.webp',
    'image_alt': 'Kasalar içinde kapya biber, beyaz incir ve nar; yapay zekâ ile oluşturulmuş temsili toptancı hali görseli',
    'tags': ['haftalık hal raporu', 'hal fiyatları', '7–13 Eylül 2026', 'HaldeFiyat Endeksi', 'kapya biber', 'beyaz incir', 'nar'],
    'content': content.strip(),
}
(root / 'content.html').write_text(patch['content'])
(root / 'patch.json').write_text(json.dumps(patch, ensure_ascii=False, indent=2))
print(json.dumps({'title': patch['title'], 'characters': len(content), 'tables': len(tables)}, ensure_ascii=False))
