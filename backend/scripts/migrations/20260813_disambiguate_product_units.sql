-- Aynı ürünün farklı satış ölçülerini kullanıcıya açık etiketle.
-- "Kasa" yalnız kaynak gerçekten kasa/koli birimi verdiğinde kullanılır; avokado
-- canlı kaynaklarında ayrım kg/adet olduğu için bu iki gerçek ölçü korunur.
UPDATE hf_products SET display_name = 'Avokado (Adet)' WHERE slug = 'avakado';
UPDATE hf_products SET display_name = 'Avokado (Kg)' WHERE slug = 'avokado';
UPDATE hf_products SET display_name = 'Avokado (Adet, Muhtelif)', canonical_slug = 'avakado'
WHERE slug IN ('avakado-muhtelif', 'avokado-muhtelif');

-- Ham ad "AVOKADO (Adet)" iken eski katalog birimi kg kalmış. Aynı kaynak satırları
-- adet fiyatı olduğundan katalog birimini ve aynı birimli master'ı birlikte düzelt.
UPDATE hf_products SET display_name = 'Avokado (Adet)', unit = 'adet', canonical_slug = 'avakado', seo_index = 0
WHERE slug = 'avokado-adet';

UPDATE hf_products SET display_name = 'Maydanoz (Demet)' WHERE slug = 'maydanoz';
UPDATE hf_products SET display_name = 'Maydanoz (Bağ)' WHERE slug = 'maydonoz';
UPDATE hf_products SET display_name = 'Maydanoz (Bağ, Muhtelif)', canonical_slug = 'maydonoz'
WHERE slug = 'maydonoz-muhtelif';
UPDATE hf_products SET display_name = 'Maydanoz (Yerli Bağ)', canonical_slug = 'maydonoz'
WHERE slug = 'maydonoz-yerli-bag';
