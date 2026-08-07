import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';
import { logPurchaseEvent } from '@/lib/purchase-events';

// Stripe checkout sessions have a 24h TTL by default.
// Sessions cannot be 'open' beyond this threshold — only 'complete' or 'expired'.
const STRIPE_SESSION_TTL_HOURS = 25;

// Stripe retries failed webhook deliveries for up to 3 days.
// Any purchase still 'pending' after 14 days is a data anomaly:
// the session is expired in Stripe and the payment (if any) would
// have surfaced via webhook retries. Bulk-expire without Stripe API calls.
const MAX_ACTIONABLE_AGE_DAYS = 14;

export interface ReconciliationSummary {
  scannedAt: string;

  // ── Input ──────────────────────────────────────────────────────────────────
  processed: number;             // total pending found
  recentProcessed: number;       // < 25h  (session may still be open)
  historicalProcessed: number;   // 25h–14d (session closed; queried for paid status)
  ancientFound: number;          // > 14d  (anomaly — bulk-expired without Stripe call)

  // ── Outcomes ───────────────────────────────────────────────────────────────
  completed: number;             // pending → completed (Stripe confirmed payment)
  expiredViaStripe: number;      // pending → expired   (Stripe said expired)
  expiredViaAge: number;         // pending → expired   (> 14d, no Stripe call)
  expired: number;               // total = expiredViaStripe + expiredViaAge
  stillPending: number;          // pending → pending   (open + async)
  stillOpen: number;             //   └─ session still open in Stripe
  asyncPaymentPending: number;   //   └─ complete but payment_status ≠ 'paid'
  missingStripeSession: number;  // no session_id OR unknown to Stripe
  errors: number;                // Stripe API errors or DB errors

  // ── Post-run state ─────────────────────────────────────────────────────────
  oldestRemainingPendingAgeHours: number | null;
}

function tag(msg: string) {
  console.log(`[Stripe Reconciliation] ${msg}`);
}

function tagError(msg: string) {
  console.error(`[Stripe Reconciliation] ${msg}`);
}

function ageHours(createdAt: string, now: Date): number {
  return (now.getTime() - new Date(createdAt).getTime()) / 3_600_000;
}

/**
 * Scans every pending purchase within the actionable window, queries Stripe
 * for the real session state, and synchronises the DB accordingly.
 *
 * Idempotent: every UPDATE is guarded by `.eq('status', 'pending')`.
 * If the webhook transitions a row concurrently, the UPDATE matches 0 rows
 * and no duplicate purchase_events row is produced.
 */
export async function reconcilePendingPurchases(): Promise<ReconciliationSummary> {
  const supabase = createServerClient();
  const now = new Date();
  const scannedAt = now.toISOString();

  const recentCutoff = new Date(now.getTime() - STRIPE_SESSION_TTL_HOURS * 3_600_000).toISOString();
  const actionableCutoff = new Date(now.getTime() - MAX_ACTIONABLE_AGE_DAYS * 86_400_000).toISOString();

  const summary: ReconciliationSummary = {
    scannedAt,
    processed: 0,
    recentProcessed: 0,
    historicalProcessed: 0,
    ancientFound: 0,
    completed: 0,
    expiredViaStripe: 0,
    expiredViaAge: 0,
    expired: 0,
    stillPending: 0,
    stillOpen: 0,
    asyncPaymentPending: 0,
    missingStripeSession: 0,
    errors: 0,
    oldestRemainingPendingAgeHours: null,
  };

  // ── Pass 1: Bulk-expire ancient purchases (> 14 days) without Stripe ──────
  // These are data anomalies. Stripe sessions are closed; no payment can arrive.
  const { data: ancientExpired, error: ancientError } = await supabase
    .from('purchases')
    .update({ status: 'expired', expired_at: scannedAt })
    .eq('status', 'pending')
    .lt('created_at', actionableCutoff)
    .select('id, user_id, book_id, stripe_session_id, created_at');

  if (ancientError) {
    tagError(`Bulk-expire of ancient purchases failed: ${ancientError.message}`);
    summary.errors++;
  } else if (ancientExpired && ancientExpired.length > 0) {
    summary.ancientFound = ancientExpired.length;
    summary.expiredViaAge = ancientExpired.length;
    tagError(
      `ANOMALY: ${ancientExpired.length} purchase(s) older than ${MAX_ACTIONABLE_AGE_DAYS} days ` +
      `were still pending — bulk-expired without Stripe query. ` +
      `Oldest: ${ancientExpired[0].created_at}`
    );
    for (const p of ancientExpired) {
      await logPurchaseEvent({
        event_type: 'checkout_expired',
        event_source: 'system',
        purchase_id: p.id,
        user_id: p.user_id,
        book_id: p.book_id,
        stripe_session_id: p.stripe_session_id ?? undefined,
        previous_status: 'pending',
        new_status: 'expired',
        metadata: {
          reconciliation: true,
          reason: `age_exceeded_${MAX_ACTIONABLE_AGE_DAYS}_days`,
          age_hours: parseFloat(ageHours(p.created_at, now).toFixed(1)),
        },
      });
    }
  }

  // ── Pass 2: Query Stripe for actionable window (0–14 days) ────────────────
  const { data: actionable, error: actionableError } = await supabase
    .from('purchases')
    .select('id, user_id, book_id, stripe_session_id, created_at')
    .eq('status', 'pending')
    .gte('created_at', actionableCutoff)
    .order('created_at', { ascending: true });

  if (actionableError) {
    tagError(`Failed to fetch actionable pending: ${actionableError.message}`);
    throw actionableError;
  }

  const actionableList = actionable ?? [];

  // Pre-compute age buckets for the summary header
  for (const p of actionableList) {
    const age = ageHours(p.created_at, now);
    if (age < STRIPE_SESSION_TTL_HOURS) {
      summary.recentProcessed++;
    } else {
      summary.historicalProcessed++;
    }
  }

  summary.processed = summary.recentProcessed + summary.historicalProcessed + summary.ancientFound;

  if (actionableList.length === 0) {
    tag(`No actionable pending purchases (0–${MAX_ACTIONABLE_AGE_DAYS}d).`);
  } else {
    tag(
      `Processing ${actionableList.length} actionable pending purchases ` +
      `(${summary.recentProcessed} recent <${STRIPE_SESSION_TTL_HOURS}h, ` +
      `${summary.historicalProcessed} historical <${MAX_ACTIONABLE_AGE_DAYS}d)...`
    );
  }

  for (const purchase of actionableList) {
    const age = ageHours(purchase.created_at, now);
    const ageLabel = `${age.toFixed(1)}h`;

    // ── Case 1: stripe_session_id is NULL ────────────────────────────────────
    if (!purchase.stripe_session_id) {
      tagError(
        `Purchase: ${purchase.id} | Age: ${ageLabel} | Session: NONE | ` +
        `Reason: Missing stripe_session_id — anomaly`
      );
      summary.missingStripeSession++;
      continue;
    }

    // ── Retrieve session from Stripe ─────────────────────────────────────────
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(purchase.stripe_session_id);
    } catch (err: any) {
      if (err?.code === 'resource_missing') {
        // ── Case 2: unknown to Stripe ─────────────────────────────────────────
        tagError(
          `Purchase: ${purchase.id} | Age: ${ageLabel} | Session: ${purchase.stripe_session_id} | ` +
          `Reason: Stripe returned "No such checkout session" — anomaly`
        );
        summary.missingStripeSession++;
      } else {
        tagError(
          `Purchase: ${purchase.id} | Age: ${ageLabel} | Session: ${purchase.stripe_session_id} | ` +
          `Error: ${err?.message ?? err}`
        );
        summary.errors++;
      }
      continue;
    }

    // ── Case 3: session still open ────────────────────────────────────────────
    if (session.status === 'open') {
      tag(
        `Purchase: ${purchase.id} | Age: ${ageLabel} | Session: ${purchase.stripe_session_id} | ` +
        `pending → pending | Reason: Session still open`
      );
      summary.stillOpen++;
      continue;
    }

    // ── Case 4: payment confirmed ─────────────────────────────────────────────
    if (session.status === 'complete' && session.payment_status === 'paid') {
      const paymentIntent =
        typeof session.payment_intent === 'string' ? session.payment_intent : null;

      const { data: updated, error: updateError } = await supabase
        .from('purchases')
        .update({
          status: 'completed',
          stripe_payment_intent: paymentIntent,
        })
        .eq('id', purchase.id)
        .eq('status', 'pending') // optimistic guard: no-op if webhook already beat us
        .select('id');

      if (updateError) {
        tagError(
          `Purchase: ${purchase.id} | Age: ${ageLabel} | Update failed: ${updateError.message}`
        );
        summary.errors++;
        continue;
      }

      if (!updated || updated.length === 0) {
        tag(
          `Purchase: ${purchase.id} | Age: ${ageLabel} | Skipped: already transitioned by webhook`
        );
        continue;
      }

      tag(
        `Purchase: ${purchase.id} | Age: ${ageLabel} | Session: ${purchase.stripe_session_id} | ` +
        `pending → completed | Reason: Stripe confirmed payment`
      );

      await logPurchaseEvent({
        event_type: 'payment_completed',
        event_source: 'system',
        purchase_id: purchase.id,
        user_id: purchase.user_id,
        book_id: purchase.book_id,
        stripe_session_id: purchase.stripe_session_id,
        stripe_payment_intent: paymentIntent ?? undefined,
        previous_status: 'pending',
        new_status: 'completed',
        metadata: {
          reconciliation: true,
          age_hours: parseFloat(age.toFixed(1)),
        },
      });

      summary.completed++;
      continue;
    }

    // ── Case 5: session expired ───────────────────────────────────────────────
    if (session.status === 'expired') {
      const { data: updated, error: updateError } = await supabase
        .from('purchases')
        .update({
          status: 'expired',
          expired_at: scannedAt,
        })
        .eq('id', purchase.id)
        .eq('status', 'pending') // optimistic guard
        .select('id');

      if (updateError) {
        tagError(
          `Purchase: ${purchase.id} | Age: ${ageLabel} | Update failed: ${updateError.message}`
        );
        summary.errors++;
        continue;
      }

      if (!updated || updated.length === 0) {
        tag(
          `Purchase: ${purchase.id} | Age: ${ageLabel} | Skipped: already transitioned`
        );
        continue;
      }

      tag(
        `Purchase: ${purchase.id} | Age: ${ageLabel} | Session: ${purchase.stripe_session_id} | ` +
        `pending → expired | Reason: Stripe session expired`
      );

      await logPurchaseEvent({
        event_type: 'checkout_expired',
        event_source: 'system',
        purchase_id: purchase.id,
        user_id: purchase.user_id,
        book_id: purchase.book_id,
        stripe_session_id: purchase.stripe_session_id,
        previous_status: 'pending',
        new_status: 'expired',
        metadata: {
          reconciliation: true,
          age_hours: parseFloat(age.toFixed(1)),
        },
      });

      summary.expiredViaStripe++;
      continue;
    }

    // ── Unexpected: complete + payment_status ≠ 'paid' ────────────────────────
    // Async payment methods (SEPA, bank transfer) can leave a session 'complete'
    // with payment_status 'unpaid' while the bank transfer settles.
    // Leave as pending — Stripe will fire a webhook when the payment clears.
    tag(
      `Purchase: ${purchase.id} | Age: ${ageLabel} | Session: ${purchase.stripe_session_id} | ` +
      `pending → pending | Reason: Session complete but payment_status=${session.payment_status} — awaiting async confirmation`
    );
    summary.asyncPaymentPending++;
  }

  // ── Derive totals ─────────────────────────────────────────────────────────
  summary.expired = summary.expiredViaStripe + summary.expiredViaAge;
  summary.stillPending = summary.stillOpen + summary.asyncPaymentPending;

  // ── Find oldest still-pending after this run ──────────────────────────────
  const { data: oldest } = await supabase
    .from('purchases')
    .select('created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (oldest && oldest.length > 0) {
    summary.oldestRemainingPendingAgeHours = parseFloat(
      ageHours(oldest[0].created_at, now).toFixed(1)
    );
  }

  // ── Structured summary log ────────────────────────────────────────────────
  tag('── Summary ──────────────────────────────────────────────────────');
  tag(`Scanned:                 ${summary.processed} pending`);
  tag(`  ↳ recent  (<${STRIPE_SESSION_TTL_HOURS}h):       ${summary.recentProcessed}`);
  tag(`  ↳ historical (<${MAX_ACTIONABLE_AGE_DAYS}d):    ${summary.historicalProcessed}`);
  tag(`  ↳ ancient  (≥${MAX_ACTIONABLE_AGE_DAYS}d):     ${summary.ancientFound}${summary.ancientFound > 0 ? ' ← ANOMALY' : ''}`);
  tag(`Completed:               ${summary.completed}`);
  tag(`Expired via Stripe:      ${summary.expiredViaStripe}`);
  tag(`Expired via age:         ${summary.expiredViaAge}${summary.expiredViaAge > 0 ? ' ← ANOMALY' : ''}`);
  tag(`Still open:              ${summary.stillOpen}`);
  tag(`Async payment pending:   ${summary.asyncPaymentPending}`);
  tag(`Missing/unknown session: ${summary.missingStripeSession}${summary.missingStripeSession > 0 ? ' ← ANOMALY' : ''}`);
  tag(`Errors:                  ${summary.errors}${summary.errors > 0 ? ' ← CHECK LOGS' : ''}`);
  if (summary.oldestRemainingPendingAgeHours !== null) {
    tag(`Oldest still-pending:    ${summary.oldestRemainingPendingAgeHours}h`);
  }
  tag('─────────────────────────────────────────────────────────────────');

  return summary;
}
