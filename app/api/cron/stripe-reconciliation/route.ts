export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { reconcilePendingPurchases } from '@/lib/stripe/reconciliation';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await reconcilePendingPurchases();
    return NextResponse.json({
      success: true,
      processed: summary.processed,
      completed: summary.completed,
      expired: summary.expired,
      stillPending: summary.stillPending,
      missingStripeSession: summary.missingStripeSession,
      errors: summary.errors,
    });
  } catch (err: any) {
    console.error('[Cron] stripe-reconciliation failed:', err?.message);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
