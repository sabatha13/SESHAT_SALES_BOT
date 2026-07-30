import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/admin';
import { logPurchaseEvent } from '@/lib/purchase-events';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await assertAdmin(userId);

    const supabase = createServerClient();
    const { user_id, book_id, grant_type, amount, payment_method } = await req.json();

    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user_id)
      .eq('book_id', book_id)
      .single();

    if (existing) return NextResponse.json({ error: 'Livre déjà accordé' }, { status: 400 });

    const isPaid = grant_type === 'paid_external' && amount > 0;
    const { data: grantedPurchase, error } = await supabase.from('purchases').insert({
      user_id,
      book_id,
      stripe_session_id: (isPaid ? 'manual_paid_' : 'manual_grant_') + Date.now(),
      amount: isPaid ? amount : 0,
      payment_method: isPaid ? (payment_method || 'Autre') : null,
      status: 'completed',
    }).select('id').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logPurchaseEvent({
      event_type: isPaid ? 'external_grant' : 'book_granted',
      event_source: 'admin',
      purchase_id: grantedPurchase?.id,
      user_id,
      book_id,
      new_status: 'completed',
      metadata: {
        grant_type,
        amount: isPaid ? amount : 0,
        payment_method: isPaid ? (payment_method || 'Autre') : null,
        admin_clerk_id: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
