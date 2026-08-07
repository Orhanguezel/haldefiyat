ALTER TABLE hf_banners
  ADD COLUMN deal_id INT NULL AFTER sponsorship_id,
  ADD INDEX hf_banners_deal_idx (deal_id);
