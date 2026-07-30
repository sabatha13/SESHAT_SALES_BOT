-- Idempotency guard for Stripe webhook events.
-- Uses a partial unique index on metadata->>'stripe_event_id'.
-- Stripe's event.id (e.g. evt_abc123) is stable across webhook retries.
-- A second INSERT with the same stripe_event_id violates this constraint
-- and is caught silently by logPurchaseEvent's try/catch — no duplicate events.

CREATE UNIQUE INDEX idx_purchase_events_stripe_event_id
  ON purchase_events ((metadata->>'stripe_event_id'))
  WHERE metadata->>'stripe_event_id' IS NOT NULL;
