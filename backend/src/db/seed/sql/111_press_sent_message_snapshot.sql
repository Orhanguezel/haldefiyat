-- Her basın gönderiminde alıcıya teslim edilen içeriğin değişmez kopyası.
ALTER TABLE hf_press_outreach_logs
  ADD COLUMN sent_subject VARCHAR(255) NULL AFTER smtp_handoff_at,
  ADD COLUMN sent_html LONGTEXT NULL AFTER sent_subject,
  ADD COLUMN sent_text LONGTEXT NULL AFTER sent_html,
  ADD COLUMN sent_from_email VARCHAR(255) NULL AFTER sent_text,
  ADD COLUMN sent_reply_to_email VARCHAR(255) NULL AFTER sent_from_email;
