-- Track when the last recovery email was sent to prevent spam
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS last_recovery_email_sent_at TIMESTAMPTZ NULL;
