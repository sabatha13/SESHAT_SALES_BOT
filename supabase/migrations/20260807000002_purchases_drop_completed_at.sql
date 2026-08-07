-- completed_at was added in 20260807000001 but is redundant:
-- purchase_events records the exact timestamp of every payment_completed event
-- for all code paths (webhook, checkout recovery, succes page, reconciliation).
-- A denormalised column that only the reconciliation service sets would leave
-- most completed purchases with NULL, making it unreliable for analytics.
-- Query completion time via:
--   SELECT created_at FROM purchase_events
--   WHERE purchase_id = $1 AND event_type = 'payment_completed'
--   ORDER BY created_at LIMIT 1;
ALTER TABLE purchases DROP COLUMN IF EXISTS completed_at;
