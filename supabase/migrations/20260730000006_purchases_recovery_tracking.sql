-- Full recovery email tracking: count + first sent + last sent
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS recovery_email_count      INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_recovery_email_sent_at TIMESTAMPTZ NULL;
