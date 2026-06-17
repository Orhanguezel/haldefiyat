-- haldefiyat X (Twitter) içerik stratejisi — haftalık otomasyon slotları.
-- Plan sekmesi bunları gösterir; günlük cron "daily_movers" slotunu üretir.
-- (ekosistem HALDEFIYAT_X_SLOTS karşılığı; gün 1-7 = Pzt-Paz, Berlin yerine Istanbul.)
INSERT INTO social_content_plans
  (id, platform, slot_key, day_of_week, hour, minute, template, pillar, topic, post_format, media_required, is_active, order_index, created_at, updated_at)
VALUES
  (UUID(), 'twitter', 'morning', 1, 9, 0, 'daily_movers',  'veri', 'Günün hareketi — en çok artan/düşen', 'post', 0, 1, 1, NOW(), NOW()),
  (UUID(), 'twitter', 'morning', 2, 9, 0, 'daily_movers',  'veri', 'Günün hareketi — en çok artan/düşen', 'post', 0, 1, 2, NOW(), NOW()),
  (UUID(), 'twitter', 'morning', 3, 9, 0, 'daily_movers',  'veri', 'Günün hareketi — en çok artan/düşen', 'post', 0, 1, 3, NOW(), NOW()),
  (UUID(), 'twitter', 'morning', 4, 9, 0, 'daily_movers',  'veri', 'Günün hareketi — en çok artan/düşen', 'post', 0, 1, 4, NOW(), NOW()),
  (UUID(), 'twitter', 'morning', 5, 9, 0, 'daily_movers',  'veri', 'Günün hareketi — en çok artan/düşen', 'post', 0, 1, 5, NOW(), NOW()),
  (UUID(), 'twitter', 'morning', 6, 9, 0, 'daily_movers',  'veri', 'Günün hareketi — en çok artan/düşen', 'post', 0, 1, 6, NOW(), NOW()),
  (UUID(), 'twitter', 'morning', 7, 9, 0, 'daily_movers',  'veri', 'Günün hareketi — en çok artan/düşen', 'post', 0, 1, 7, NOW(), NOW()),
  (UUID(), 'twitter', 'weekly',  7, 19, 0, 'weekly_index', 'analiz', 'Haftalık fiyat analizi özeti', 'post', 0, 1, 8, NOW(), NOW());
