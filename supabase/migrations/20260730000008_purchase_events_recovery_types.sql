-- Extend purchase_events CHECK constraint with recovery event types
ALTER TABLE purchase_events
  DROP CONSTRAINT purchase_events_event_type_check;

ALTER TABLE purchase_events
  ADD CONSTRAINT purchase_events_event_type_check CHECK (event_type IN (
    'checkout_created', 'checkout_resumed', 'checkout_expired',
    'payment_completed', 'payment_refunded',
    'external_grant', 'book_granted',
    'download_requested', 'download_completed',
    'recovery_email_sent', 'recovery_tracking_failed'
  ));
