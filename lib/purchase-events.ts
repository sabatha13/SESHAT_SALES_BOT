import { createServerClient } from '@/lib/supabase/server';

export type EventType =
  | 'checkout_created'
  | 'checkout_resumed'
  | 'checkout_expired'
  | 'payment_completed'
  | 'payment_refunded'
  | 'external_grant'
  | 'book_granted'
  | 'download_requested'
  | 'download_completed'
  | 'recovery_email_sent'
  | 'recovery_tracking_failed'
  | 'newsletter_sent'
  | 'coupon_applied';

export type EventSource =
  | 'checkout'
  | 'checkout_recovery'
  | 'webhook'
  | 'admin'
  | 'download'
  | 'token_redemption'
  | 'system';

export interface PurchaseEventInput {
  event_type: EventType;
  event_source: EventSource;
  user_id: string;
  book_id: string;
  purchase_id?: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  previous_status?: string;
  new_status?: string;
  campaign_run_id?: string;
  metadata?: Record<string, unknown>;
}

export async function logPurchaseEvent(input: PurchaseEventInput): Promise<void> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('purchase_events').insert(input);
    if (error) console.error(`[purchase_events] ${input.event_type} failed:`, error.message);
  } catch (err: any) {
    console.error(`[purchase_events] ${input.event_type} threw:`, err?.message ?? err);
  }
}
