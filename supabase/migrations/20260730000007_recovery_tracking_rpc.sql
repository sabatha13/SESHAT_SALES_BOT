-- Atomic recovery tracking update.
-- Single SQL statement — no read-modify-write race condition.
-- COALESCE preserves first_recovery_email_sent_at if already set.
CREATE OR REPLACE FUNCTION update_recovery_tracking(
  p_purchase_id UUID,
  p_sent_at     TIMESTAMPTZ
) RETURNS void
LANGUAGE sql
AS $$
  UPDATE purchases
  SET
    last_recovery_email_sent_at  = p_sent_at,
    recovery_email_count         = recovery_email_count + 1,
    first_recovery_email_sent_at = COALESCE(first_recovery_email_sent_at, p_sent_at)
  WHERE id = p_purchase_id;
$$;
