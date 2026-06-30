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
    const { purchase_id, delete_all_pending } = await req.json();

    if (delete_all_pending) {
      const { error } = await supabase.from('purchases').delete().eq('status', 'pending');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from('purchases').delete().eq('id', purchase_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
