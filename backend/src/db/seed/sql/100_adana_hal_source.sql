-- Official source is enabled by config; preserve identity across fresh installs.
INSERT INTO hf_markets (slug,name,city_name,region_slug,source_key,market_type,seo_index,is_active)
VALUES ('adana-hal','Adana Büyükşehir Belediyesi Toptancı Hali','Adana','akdeniz','adana_resmi','hal',1,1)
ON DUPLICATE KEY UPDATE source_key=VALUES(source_key);
