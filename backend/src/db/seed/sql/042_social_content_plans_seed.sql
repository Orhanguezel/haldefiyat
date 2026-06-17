-- haldefiyat X (Twitter) içerik stratejisi — slot bazlı (platform+slot_key UNIQUE).
-- Plan sekmesi bunları gösterir. Gerçek otomasyon hal cron'unda:
--   morning → her gün 09:00 TR "Günün hareketi" (social-daily-movers)
--   weekly  → haftalık analiz yayınlanınca özet tweet taslağı
INSERT INTO social_content_plans
  (id, platform, slot_key, day_of_week, hour, minute, template, pillar, topic, post_format, media_required, is_active, order_index, created_at, updated_at)
VALUES
  (UUID(), 'twitter', 'morning', 0, 9, 0, 'daily_movers',  'veri',   'Her gün: en çok artan/düşen ürünler', 'post', 0, 1, 1, NOW(), NOW()),
  (UUID(), 'twitter', 'weekly',  7, 19, 0, 'weekly_index', 'analiz', 'Haftalık: fiyat analizi özeti (taslak)', 'post', 0, 1, 2, NOW(), NOW())
ON DUPLICATE KEY UPDATE template=VALUES(template), topic=VALUES(topic), updated_at=NOW();
