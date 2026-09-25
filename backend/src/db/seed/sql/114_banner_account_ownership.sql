ALTER TABLE hf_banners
  ADD COLUMN owner_user_id VARCHAR(36) NULL AFTER advertiser,
  ADD KEY hf_banners_owner_user_idx (owner_user_id);

UPDATE hf_banners
SET owner_user_id = @ADMIN_ID
WHERE advertiser = 'GZL Teknoloji'
  AND owner_user_id IS NULL;
