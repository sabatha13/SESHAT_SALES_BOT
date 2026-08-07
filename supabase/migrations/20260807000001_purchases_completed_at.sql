-- Track when a purchase was confirmed as paid.
-- Set by the reconciliation service and can be backfilled by any future
-- webhook/recovery path. NULL means not yet confirmed.
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
