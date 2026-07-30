-- Observability for purchase recovery (Stripe abandoned checkout handling)

-- 1. Track when a Stripe checkout session expired.
--    Set to NOW() on pending → expired.
--    Cleared to NULL when a new Checkout Session is created after expiration.
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ NULL;

-- 2. Immutable audit trail for every pending → completed transition.
--    recovery_source distinguishes normal webhook from checkout-route recovery.
--    This table NEVER grants any permission — it is for traceability only.
CREATE TABLE IF NOT EXISTS purchase_audit (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id            UUID        NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  book_id                UUID        NOT NULL REFERENCES books(id)     ON DELETE RESTRICT,
  stripe_session_id      TEXT,
  stripe_payment_intent  TEXT,
  previous_status        TEXT        NOT NULL,
  new_status             TEXT        NOT NULL,
  recovery_source        TEXT        NOT NULL CHECK (recovery_source IN ('webhook', 'checkout_recovery')),
  recovered_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by           TEXT        NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_purchase_audit_purchase_id   ON purchase_audit(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_audit_user_id       ON purchase_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_audit_recovered_at  ON purchase_audit(recovered_at DESC);

ALTER TABLE purchase_audit ENABLE ROW LEVEL SECURITY;
-- Intentionally no user-facing SELECT policy.
-- Readable by service_role only (admin SQL console / Supabase Studio).
