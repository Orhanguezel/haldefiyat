-- Basın CRM tohum verisi: örnek basın içerikleri (kampanya taslakları) + hedef medya listesi.
-- E-postalar BİLİNÇLİ placeholder (dogrulanacak+<slug>@haldefiyat.com): gerçek 3. tarafa
-- yanlışlıkla gönderim olmasın; kullanıcı halka açık editör/haber adresini doğrular.
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
-- e-posta placeholder; halka açık editör/haber adresiyle doğrulanacak.
INSERT INTO hf_press_contacts (organization, publication_type, contact_name, email, phone, city, tags, status, notes, created_at, updated_at) VALUES
-- Ulusal ekonomi & ajans
('Ekonomim (eski Dünya Gazetesi)','newspaper',NULL,'dogrulanacak+ekonomim@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi','tarim-ekonomi'),'target','Ekonomi masası; hal/gıda enflasyonu haberleri. Editör e-postası doğrulanacak.',NOW(3),NOW(3)),
('Bloomberg HT','website',NULL,'dogrulanacak+bloomberght@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi','tv'),'target','Ekonomi/piyasa; enflasyon-gıda içeriği. Haber merkezi adresi doğrulanacak.',NOW(3),NOW(3)),
('Anadolu Ajansı — Ekonomi','agency',NULL,'dogrulanacak+aa-ekonomi@haldefiyat.com',NULL,'Ankara',JSON_ARRAY('ajans','ulusal','ekonomi'),'target','Ekonomi servisi; veri temelli haber alır. Servis e-postası doğrulanacak.',NOW(3),NOW(3)),
('DHA — Ekonomi','agency',NULL,'dogrulanacak+dha@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ajans','ulusal'),'target','Demirören Haber Ajansı ekonomi. Doğrulanacak.',NOW(3),NOW(3)),
('İHA — Ekonomi','agency',NULL,'dogrulanacak+iha@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ajans','ulusal'),'target','İhlas Haber Ajansı ekonomi. Doğrulanacak.',NOW(3),NOW(3)),
('Dünya Gazetesi','newspaper',NULL,'dogrulanacak+dunya@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi'),'target','Ekonomi gazetesi tarım-gıda masası. Doğrulanacak.',NOW(3),NOW(3)),
-- Tarım özel medya
('Tarım Türk','website',NULL,'dogrulanacak+tarimturk@haldefiyat.com',NULL,NULL,JSON_ARRAY('tarim','sektor'),'target','Tarım sektörü yayını. Doğrulanacak.',NOW(3),NOW(3)),
('Tarımdan Haber','website',NULL,'dogrulanacak+tarimdanhaber@haldefiyat.com',NULL,NULL,JSON_ARRAY('tarim','haber'),'target','Tarım haber portalı. Doğrulanacak.',NOW(3),NOW(3)),
('Agro Haber','website',NULL,'dogrulanacak+agrohaber@haldefiyat.com',NULL,NULL,JSON_ARRAY('tarim','agro'),'target','Tarım/agro portalı. Doğrulanacak.',NOW(3),NOW(3)),
('Hasat Yayıncılık','website',NULL,'dogrulanacak+hasat@haldefiyat.com',NULL,NULL,JSON_ARRAY('tarim','dergi'),'target','Tarım dergisi/portalı. Doğrulanacak.',NOW(3),NOW(3)),
('Çiftçi TV','website',NULL,'dogrulanacak+ciftcitv@haldefiyat.com',NULL,NULL,JSON_ARRAY('tarim','tv','video'),'target','Tarım video içeriği. Doğrulanacak.',NOW(3),NOW(3)),
('Tarım Pusulası','website',NULL,'dogrulanacak+tarimpusulasi@haldefiyat.com',NULL,NULL,JSON_ARRAY('tarim'),'target','Tarım portalı. Doğrulanacak.',NOW(3),NOW(3)),
-- Yerel / hal şehirleri
('Antalya Körfez Gazetesi','newspaper',NULL,'dogrulanacak+antalyakorfez@haldefiyat.com',NULL,'Antalya',JSON_ARRAY('yerel','antalya','hal-sehri'),'target','Antalya hal/üretim bölgesi; yerel gıda haberi. Doğrulanacak.',NOW(3),NOW(3)),
('Mersin Zamanı','newspaper',NULL,'dogrulanacak+mersinzamani@haldefiyat.com',NULL,'Mersin',JSON_ARRAY('yerel','mersin','hal-sehri'),'target','Mersin hal/narenciye bölgesi. Doğrulanacak.',NOW(3),NOW(3)),
('İzmir Ege Telgraf','newspaper',NULL,'dogrulanacak+egetelgraf@haldefiyat.com',NULL,'İzmir',JSON_ARRAY('yerel','izmir','hal-sehri'),'target','İzmir hal bölgesi. Doğrulanacak.',NOW(3),NOW(3)),
('Bursa Olay','newspaper',NULL,'dogrulanacak+bursaolay@haldefiyat.com',NULL,'Bursa',JSON_ARRAY('yerel','bursa','hal-sehri'),'target','Bursa hal bölgesi. Doğrulanacak.',NOW(3),NOW(3)),
('Konya Yenigün','newspaper',NULL,'dogrulanacak+konyayenigun@haldefiyat.com',NULL,'Konya',JSON_ARRAY('yerel','konya','tarim'),'target','Konya tarım/hal. Doğrulanacak.',NOW(3),NOW(3)),
('Adana 5 Ocak','newspaper',NULL,'dogrulanacak+adana5ocak@haldefiyat.com',NULL,'Adana',JSON_ARRAY('yerel','adana','hal-sehri'),'target','Adana hal/borsa bölgesi. Doğrulanacak.',NOW(3),NOW(3)),
-- Dernek / oda / kurum
('Türkiye Ziraat Odaları Birliği (TZOB)','association',NULL,'dogrulanacak+tzob@haldefiyat.com',NULL,'Ankara',JSON_ARRAY('dernek','ulusal','tarim'),'target','TZOB basın/veri; ürün maliyet açıklamaları. Doğrulanacak.',NOW(3),NOW(3)),
('İstanbul Ticaret Borsası','chamber',NULL,'dogrulanacak+istib@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('borsa','oda'),'target','Ticaret borsası basın. Doğrulanacak.',NOW(3),NOW(3)),
('Antalya Ticaret Borsası','chamber',NULL,'dogrulanacak+atb@haldefiyat.com',NULL,'Antalya',JSON_ARRAY('borsa','oda','antalya'),'target','Antalya borsa. Doğrulanacak.',NOW(3),NOW(3)),
('ANTKOMDER (Antalya Komisyoncular Derneği)','association',NULL,'dogrulanacak+antkomder@haldefiyat.com',NULL,'Antalya',JSON_ARRAY('dernek','komisyoncu','antalya'),'target','Hal komisyoncuları derneği; sektör bağı. Doğrulanacak.',NOW(3),NOW(3)),
('Toprak Mahsulleri Ofisi (TMO)','association',NULL,'dogrulanacak+tmo@haldefiyat.com',NULL,'Ankara',JSON_ARRAY('kurum','tarim','fiyat'),'target','Kamu; alım fiyatı açıklamaları. Doğrulanacak.',NOW(3),NOW(3)),
-- Genel/ulusal büyük
('Habertürk — Ekonomi','website',NULL,'dogrulanacak+haberturk@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi'),'target','Ekonomi masası. Doğrulanacak.',NOW(3),NOW(3)),
('Sözcü — Ekonomi','website',NULL,'dogrulanacak+sozcu@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','ekonomi','tuketici'),'target','Tüketici/geçim haberleri. Doğrulanacak.',NOW(3),NOW(3)),
('T24','website',NULL,'dogrulanacak+t24@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','veri-gazeteciligi'),'target','Veri temelli haber. Doğrulanacak.',NOW(3),NOW(3)),
('Gazete Duvar','website',NULL,'dogrulanacak+duvar@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','geçim'),'target','Geçim/emek haberleri. Doğrulanacak.',NOW(3),NOW(3)),
('BBC Türkçe','website',NULL,'dogrulanacak+bbcturkce@haldefiyat.com',NULL,'İstanbul',JSON_ARRAY('ulusal','veri','uluslararasi'),'target','Veri temelli enflasyon/gıda içeriği. Doğrulanacak.',NOW(3),NOW(3));
