-- Add 'expired' and document 'external' statuses on purchases.status
-- Dropped old CHECK (pending/completed/refunded) which had already been bypassed by 'external' rows.
-- New constraint: pending | completed | refunded | external | expired
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'purchases'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%'
  LIMIT 1;
  IF v_conname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE purchases DROP CONSTRAINT ' || quote_ident(v_conname);
  END IF;
END;
$$;

ALTER TABLE purchases
  ADD CONSTRAINT purchases_status_check
  CHECK (status IN ('pending', 'completed', 'refunded', 'external', 'expired'));
