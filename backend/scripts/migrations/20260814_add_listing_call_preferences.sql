ALTER TABLE hf_listings
  ADD COLUMN call_requests_enabled TINYINT NOT NULL DEFAULT 1 AFTER hide_phone,
  ADD COLUMN call_availability VARCHAR(96) NOT NULL DEFAULT 'asap,morning,afternoon,evening' AFTER call_requests_enabled;
