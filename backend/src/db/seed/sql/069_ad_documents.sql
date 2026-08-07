ALTER TABLE hf_banners
  ADD COLUMN invoice_number VARCHAR(120) NULL AFTER payment_reminder_sent_at,
  ADD COLUMN invoice_url VARCHAR(512) NULL AFTER invoice_number,
  ADD COLUMN contract_file_url VARCHAR(512) NULL AFTER invoice_url,
  ADD COLUMN creative_file_url VARCHAR(512) NULL AFTER contract_file_url;
