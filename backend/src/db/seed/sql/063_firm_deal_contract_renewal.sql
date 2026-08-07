ALTER TABLE hf_firm_deals
  ADD COLUMN contract_number VARCHAR(96) NULL AFTER notes,
  ADD COLUMN contract_url VARCHAR(500) NULL AFTER contract_number,
  ADD COLUMN renewal_reminder_days INT NOT NULL DEFAULT 14 AFTER contract_url;
