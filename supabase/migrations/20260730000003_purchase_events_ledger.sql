-- Upgrade purchase_audit → purchase_events
-- Append-only event ledger for the full purchase lifecycle.
-- Every business event on a purchase produces one row — never updated, never deleted.

CREATE TABLE purchase_events (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type             TEXT        NOT NULL,
  event_source           TEXT        NOT NULL,
  purchase_id            UUID        REFERENCES purchases(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  book_id                UUID        NOT NULL REFERENCES books(id)     ON DELETE RESTRICT,
  stripe_session_id      TEXT,
  stripe_payment_intent  TEXT,
  previous_status        TEXT,
  new_status             TEXT,
  metadata               JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT purchase_events_event_type_check CHECK (event_type IN (
    'checkout_created',
    'checkout_resumed',
    'checkout_expired',
    'payment_completed',
    'payment_refunded',
    'external_grant',
    'book_granted',
    'download_requested',
    'download_completed'
  )),
  CONSTRAINT purchase_events_event_source_check CHECK (event_source IN (
    'checkout',
    'checkout_recovery',
    'webhook',
    'admin',
    'download',
    'token_redemption',
    'system'
  ))
);

-- Migrate existing purchase_audit rows into the new ledger (if the table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'purchase_audit'
  ) THEN
    INSERT INTO purchase_events (
      id, event_type, event_source,
      purchase_id, user_id, book_id,
      stripe_session_id, stripe_payment_intent,
      previous_status, new_status,
      metadata, created_at
    )
    SELECT
      id,
      'payment_completed',
      CASE recovery_source
        WHEN 'webhook'            THEN 'webhook'
        WHEN 'checkout_recovery'  THEN 'checkout_recovery'
        ELSE 'system'
      END,
      purchase_id, user_id, book_id,
      stripe_session_id, stripe_payment_intent,
      previous_status, new_status,
      jsonb_build_object(
        'performed_by', performed_by,
        'migrated_from', 'purchase_audit'
      ),
      recovered_at
    FROM purchase_audit;

    DROP TABLE purchase_audit;
  END IF;
END;
$$;

CREATE INDEX idx_purchase_events_purchase_id ON purchase_events(purchase_id);
CREATE INDEX idx_purchase_events_user_id     ON purchase_events(user_id);
CREATE INDEX idx_purchase_events_book_id     ON purchase_events(book_id);
CREATE INDEX idx_purchase_events_event_type  ON purchase_events(event_type);
CREATE INDEX idx_purchase_events_created_at  ON purchase_events(created_at DESC);

ALTER TABLE purchase_events ENABLE ROW LEVEL SECURITY;
-- Intentionally no user-facing SELECT policy.
-- Readable by service_role only (admin SQL console / Supabase Studio).
