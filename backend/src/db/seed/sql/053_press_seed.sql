-- Basın CRM tohum verisi: örnek basın içerikleri (kampanya taslakları) + hedef medya listesi.
-- E-postalar kurumların kamuya açık iletişim/künye sayfalarından doğrulanmıştır.
-- Kaynak URL'leri ilgili kaydın notes alanında saklanır; gönderim ayrıca onay gerektirir.
-- İçerik {{degisken}} placeholder'lari kampanya gönderiminde doldurulur.

-- ============ ÖRNEK BASIN İÇERİKLERİ (kampanya taslaklari) ============
INSERT INTO hf_press_campaigns (slug, name, subject, pitch, template_key, segment_tags, status, created_at, updated_at) VALUES
('haftalik-hal-endeksi-bulteni', 'Haftalık Hal Endeksi Bülteni',
 'HaldeFiyat Haftalık Endeks: {{urun}} fiyatı %{{degisim}} {{yon}} — {{hafta}}',
 'Sayın {{yetkili}},\n\nTürkiye''nin 22+ toptancı halinden derlenen HaldeFiyat Haftalık Endeksi''nin {{hafta}} verileri açıklandı.\n\n• Haftanın endeksi: {{endeks}} puan ({{endeks_degisim}})\n• En çok artan: {{artan_urun}} (%{{artan_pct}})\n• En çok gerileyen: {{gerileyen_urun}} (%{{gerileyen_pct}})\n• Sofra sepeti: {{sepet_ozet}}\n\nVeriler resmi belediye hal müdürlükleri, ticaret borsaları ve Bakanlık kaynaklarından günlük ETL ile toplanıp ürün/birim normalizasyonundan geçirilmektedir. Metodoloji: https://haldefiyat.com/metodoloji\n\nHazır grafik, tablo ve alıntılanabilir veri için: {{iletisim}}\n\nHaldeFiyat — Türkiye Hal Fiyatları Veri Platformu\nhttps://haldefiyat.com',
 'press_weekly_index', JSON_ARRAY('haftalik','endeks','ekonomi'), 'draft', NOW(3), NOW(3)),

('erken-uyari-fiyat-ongorusu', 'Erken Uyarı — Fiyat Öngörüsü',
 'Veri Analizi: {{urun}} fiyatı fırladı — HaldeFiyat 2 hafta önce uyarmıştı',
 'Sayın {{yetkili}},\n\n{{urun}} fiyatındaki artış bu hafta gündeme geldi. Ancak HaldeFiyat''ın 22+ halden derlediği veri, bu tırmanışı mainstream haberlerden yaklaşık 2 hafta önce göstermişti.\n\n• {{urun}} son 4 haftada: {{trend}} TL/kg (toplam %{{toplam_pct}} artış)\n• İlk sinyal tarihi: {{sinyal_tarihi}} — kesintisiz haftalık tırmanış\n• Kapsam: {{hal_sayisi}} hal (bölgesel/mevsimsel gürültüden arındırılmış)\n\nHaldeFiyat, temel gıdalardaki sürekli fiyat tırmanışını erken tespit eden bir "erken uyarı" sistemi işletiyor. Örnek: temmuz 2026''daki soğan krizi, verimizde krizden 2 hafta önce görünüyordu.\n\nGrafik ve tam veri seti için: {{iletisim}}\n\nHaldeFiyat — https://haldefiyat.com',
 'press_early_warning', JSON_ARRAY('analiz','ongoru','veri-gazeteciligi'), 'draft', NOW(3), NOW(3)),

('fiyat-krizi-derin-analiz', 'Fiyat Krizi Derin Analiz',
 '{{urun}} Neden Pahalandı? {{hal_sayisi}} Hal Verisiyle Analiz',
 'Sayın {{yetkili}},\n\n{{urun}} fiyatlarındaki hareketi {{hal_sayisi}} toptancı halinin verisiyle analiz ettik.\n\n• Türkiye ortalaması: {{ortalama}} TL/kg\n• En ucuz hal: {{en_ucuz_hal}} ({{en_ucuz}} TL) — En pahalı: {{en_pahali_hal}} ({{en_pahali}} TL)\n• Bölgesel fark: %{{bolge_farki}}\n• Neden: {{neden}} (bolluk-kıtlık döngüsü, mevsim, lojistik)\n\nÜretici ile tüketici fiyatı arasındaki makas, hangi halde ne kadar — hepsi tek tabloda. Alıntılanabilir veri, grafik ve uzman görüşü için: {{iletisim}}\n\nHaldeFiyat — https://haldefiyat.com',
 'press_crisis_analysis', JSON_ARRAY('analiz','kriz','bolgesel'), 'draft', NOW(3), NOW(3)),

('aylik-sofra-enflasyon-raporu', 'Aylık Sofra & Enflasyon Raporu',
 'HaldeFiyat Aylık Sofra Raporu: {{ay}} ayında sebze-meyve enflasyonu',
 'Sayın {{yetkili}},\n\n{{ay}} ayı HaldeFiyat Sofra Raporu hazır. TÜİK enflasyon rakamlarıyla karşılaştırmalı, hal (toptan) tarafından bakış.\n\n• Aylık sebze-meyve toptan değişimi: %{{aylik_degisim}}\n• Sofra sepeti maliyeti: {{sepet}} TL ({{sepet_degisim}})\n• Öne çıkanlar: {{one_cikanlar}}\n• Mevsim geçişi etkisi: {{mevsim}}\n\nToptan-perakende makası ve TÜİK karşılaştırması için tam rapor: {{iletisim}}\n\nHaldeFiyat — https://haldefiyat.com',
 'press_monthly_report', JSON_ARRAY('aylik','enflasyon','tuik'), 'draft', NOW(3), NOW(3)),

('acik-veri-api-duyurusu', 'Açık Veri & API Duyurusu',
 'Türkiye''nin en kapsamlı hal fiyatı API''si geliştiricilere açıldı',
 'Sayın {{yetkili}},\n\nHaldeFiyat, 22+ toptancı halinden derlediği günlük fiyat verisini açık API ile geliştiricilere ve kurumlara sundu.\n\n• Günlük fiyat, geçmiş seri, ürün/hal bazlı sorgu\n• OpenAPI dokümantasyonu + örnek istemciler\n• Ürün fiyatları için makine-okunur Dataset (schema.org)\n• Ücretsiz katman + kurumsal kullanım\n\nTarım teknolojisi, market/tedarik zinciri ve akademik araştırma için birinci elden veri. Teknik detay ve demo: {{iletisim}}\n\nHaldeFiyat — https://haldefiyat.com',
 'press_api_launch', JSON_ARRAY('api','veri','teknoloji'), 'draft', NOW(3), NOW(3));

-- ============ HEDEF MEDYA LİSTESİ ============
-- Kamuya açık kurumsal/editör/haber adresleri.
INSERT INTO hf_press_contacts (organization, publication_type, contact_name, email, phone, city, tags, status, notes, created_at, updated_at) VALUES
-- Ulusal ekonomi & ajans
('Ekonomim (eski Dünya Gazetesi)','newspaper',NULL,'ekonomim@nbe.com.tr',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi','tarim-ekonomi'),'target','Ekonomi masası; hal/gıda enflasyonu haberleri. Kaynak: https://www.ekonomim.com/p/kunye',NOW(3),NOW(3)),
('Bloomberg HT','website',NULL,'editor@bloomberght.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi','tv'),'target','Ekonomi/piyasa; enflasyon-gıda içeriği. Kaynak: https://www.bloomberght.com/kunye',NOW(3),NOW(3)),
('Anadolu Ajansı — Ekonomi','agency',NULL,'kurumsaliletisim@aa.com.tr',NULL,'Ankara',JSON_ARRAY('ajans','ulusal','ekonomi'),'target','Ekonomi servisi; veri temelli haber alır. Kaynak: https://aa.com.tr/tr/p/iletisim',NOW(3),NOW(3)),
('DHA — Ekonomi','agency',NULL,'dhaistanbul@dha.com.tr',NULL,'İstanbul',JSON_ARRAY('ajans','ulusal'),'target','Demirören Haber Ajansı ekonomi. Kaynak: https://www.dha.com.tr/',NOW(3),NOW(3)),
('İHA — Ekonomi','agency',NULL,'yayinyonetmeni@iha.com.tr',NULL,'İstanbul',JSON_ARRAY('ajans','ulusal'),'target','İhlas Haber Ajansı ekonomi. Kaynak: https://www.iha.com.tr/iletisim',NOW(3),NOW(3)),
('Dünya Gazetesi','newspaper',NULL,'dunya@dunya.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi'),'target','Ekonomi gazetesi tarım-gıda masası. Kaynak: https://www.dunya.com/p/kunye',NOW(3),NOW(3)),
-- Tarım özel medya
('Tarım Türk','website',NULL,'tarimturk@gmail.com',NULL,NULL,JSON_ARRAY('tarim','sektor'),'target','Tarım sektörü yayını. Kaynak: https://www.tarimturk.com.tr/iletisim',NOW(3),NOW(3)),
('Tarımdan Haber','website',NULL,'iletisim@tarimdanhaber.com',NULL,NULL,JSON_ARRAY('tarim','haber'),'target','Tarım haber portalı. Kaynak: https://www.tarimdanhaber.com/',NOW(3),NOW(3)),
('Agro World Tarım Dünyası','website',NULL,'haber@aramedya.com',NULL,NULL,JSON_ARRAY('tarim','agro'),'target','Tarım sektörü yayını. Kaynak: https://www.agroworlddergisi.com/kunye/',NOW(3),NOW(3)),
('HASAD Yayıncılık','website',NULL,'kitap@hasad.com.tr',NULL,NULL,JSON_ARRAY('tarim','dergi'),'target','Tarım dergisi/yayıncılık. Kaynak: https://www.hasad.com.tr/iletisim',NOW(3),NOW(3)),
('Çiftçi TV','website',NULL,'bilgi@ciftcitv.com',NULL,NULL,JSON_ARRAY('tarim','tv','video'),'target','Tarım video içeriği. Kaynak: https://ciftcitv.com/',NOW(3),NOW(3)),
('Tarım Pusulası','website',NULL,'haber@tarimpusulasi.com',NULL,NULL,JSON_ARRAY('tarim'),'target','Tarım portalı. Kaynak: https://www.tarimpusulasi.com/sayfa/kunye-1',NOW(3),NOW(3)),
-- Yerel / hal şehirleri
('Antalya Körfez Gazetesi','newspaper',NULL,'info@antalyakorfez.com',NULL,'Antalya',JSON_ARRAY('yerel','antalya','hal-sehri'),'target','Antalya hal/üretim bölgesi; yerel gıda haberi. Kaynak: https://www.antalyakorfez.com/kunye',NOW(3),NOW(3)),
('Mersin Times','newspaper',NULL,'mersintimes@gmail.com',NULL,'Mersin',JSON_ARRAY('yerel','mersin','hal-sehri'),'target','Mersin hal/narenciye bölgesi. Kaynak: https://mersintimes.com/iletisim/',NOW(3),NOW(3)),
('İzmir Ege Telgraf','newspaper',NULL,'info@egetelgraf.com',NULL,'İzmir',JSON_ARRAY('yerel','izmir','hal-sehri'),'target','İzmir hal bölgesi. Kaynak: https://www.egetelgraf.com/iletisim',NOW(3),NOW(3)),
('Bursa Olay','newspaper',NULL,'ekonomi@olaygazetesi.com.tr',NULL,'Bursa',JSON_ARRAY('yerel','bursa','hal-sehri'),'target','Bursa hal bölgesi. Kaynak: https://www.olay.com.tr/iletisim',NOW(3),NOW(3)),
('Konya Yenigün','newspaper',NULL,'haber@konyayenigun.com',NULL,'Konya',JSON_ARRAY('yerel','konya','tarim'),'target','Konya tarım/hal. Kaynak: https://www.konyayenigun.com/',NOW(3),NOW(3)),
('Adana 5 Ocak','newspaper',NULL,'adana5ocakgazetesi@gmail.com',NULL,'Adana',JSON_ARRAY('yerel','adana','hal-sehri'),'target','Adana hal/borsa bölgesi. Kaynak: https://www.5ocakgazetesi.com/iletisim',NOW(3),NOW(3)),
-- Dernek / oda / kurum
('Türkiye Ziraat Odaları Birliği (TZOB)','association',NULL,'ziraatodalari@tzob.org.tr',NULL,'Ankara',JSON_ARRAY('dernek','ulusal','tarim'),'target','TZOB basın/veri; ürün maliyet açıklamaları. Kaynak: https://www.tzob.org.tr/iletisim/',NOW(3),NOW(3)),
('İstanbul Ticaret Borsası','chamber',NULL,'gensek@istib.org.tr',NULL,'İstanbul',JSON_ARRAY('borsa','oda'),'target','Ticaret borsası iletişim adresi. Kaynak: https://istib.org.tr/iletisim',NOW(3),NOW(3)),
('Antalya Ticaret Borsası','chamber',NULL,'info@antalyaborsa.org.tr',NULL,'Antalya',JSON_ARRAY('borsa','oda','antalya'),'target','Antalya ticaret borsası. Kaynak: https://www.antalyaborsa.org.tr/iletisim',NOW(3),NOW(3)),
('ANTKOMDER (Antalya Komisyoncular Derneği)','association',NULL,'info@antalyakomisyonculardernegi.com',NULL,'Antalya',JSON_ARRAY('dernek','komisyoncu','antalya'),'target','Hal komisyoncuları derneği; sektör bağı. Kaynak: https://antalyakomisyonculardernegi.com/iletisim',NOW(3),NOW(3)),
('Toprak Mahsulleri Ofisi (TMO)','other',NULL,'tmo@tmo.gov.tr',NULL,'Ankara',JSON_ARRAY('kurum','tarim','fiyat'),'target','Kamu kurumu; alım fiyatı açıklamaları. Basın yayını değildir.',NOW(3),NOW(3)),
-- Genel/ulusal büyük
('Habertürk — Ekonomi','website',NULL,'internet@haberturk.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi'),'target','Ekonomi masası. Kurumsal haber iletişim adresi. Kaynak: https://www.haberturk.com/kunye',NOW(3),NOW(3)),
('Sözcü — Ekonomi','website',NULL,'net@sozcu.com.tr',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi','tuketici'),'target','Tüketici/geçim haberleri. Kaynak: https://www.sozcu.com.tr/iletisim-pg14',NOW(3),NOW(3)),
('T24','website',NULL,'bilgi@t24.com.tr',NULL,'İstanbul',JSON_ARRAY('ulusal','veri-gazeteciligi'),'target','Veri temelli haber. Kaynak: https://t24.com.tr/hakkimizda',NOW(3),NOW(3)),
('Gazete Duvar','website',NULL,'info@gazeteduvar.com.tr',NULL,'İstanbul',JSON_ARRAY('ulusal','geçim'),'target','Geçim/emek haberleri. Kaynak: https://www.gazeteduvar.com.tr/kunye-sayfasi',NOW(3),NOW(3)),
('BBC Türkçe','website',NULL,'BBC.turkce@bbc.co.uk',NULL,'İstanbul',JSON_ARRAY('ulusal','veri','uluslararasi'),'target','Veri temelli enflasyon/gıda içeriği. Kaynak: https://www.bbc.com/turkce/send/u50853841',NOW(3),NOW(3));
