ALTER TABLE hf_phone_verifications
  ADD COLUMN user_id CHAR(36) NULL AFTER id,
  ADD INDEX hf_phone_verifications_user_idx (user_id, purpose, expires_at);
