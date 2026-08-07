ALTER TABLE hf_banners
  ADD COLUMN payment_grace_hours INT NOT NULL DEFAULT 72 AFTER payment_due_at,
  ADD COLUMN payment_reminder_sent_at DATETIME(3) NULL AFTER payment_grace_hours;

UPDATE hf_banners
SET payment_due_at = COALESCE(payment_due_at, reservation_expires_at)
WHERE lifecycle_status IN ('reserved', 'payment_pending')
  AND payment_status IN ('unpaid', 'partial');
