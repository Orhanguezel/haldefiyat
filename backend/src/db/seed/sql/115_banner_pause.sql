ALTER TABLE hf_banners
  MODIFY COLUMN lifecycle_status ENUM(
    'draft','proposal','reserved','payment_pending','scheduled',
    'live','paused','completed','cancelled','problem','archived'
  ) NOT NULL DEFAULT 'draft';
