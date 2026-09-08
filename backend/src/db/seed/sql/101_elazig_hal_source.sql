-- Elazig hal kaynagi (2026-09-08 il taramasi). Kimlik fresh kurulumda korunur.
INSERT INTO hf_markets (slug,name,city_name,region_slug,source_key,market_type,seo_index,is_active)
VALUES ('elazig-hal','Elazığ Belediyesi Toptancı Hali','Elazığ','dogu-anadolu','elazig_resmi','hal',1,1)
ON DUPLICATE KEY UPDATE source_key=VALUES(source_key);
