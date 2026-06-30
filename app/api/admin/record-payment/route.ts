import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await assertAdmin(userId);

    const supabase = createServerClient();
    const { user_id, amount, payment_method } = await req.json();

    if (!user_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { error } = await supabase.from('purchases').insert({
      user_id,
      book_id: null,
      amount,
      status: 'external',
      payment_method: payment_method || 'Autre',
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
