export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  return data?.is_admin === true;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { data } = await supabase
    .from('subscriptions')
    .select('*, profile:profiles(email, full_name), plan:subscription_plans(name, interval, price_cents)')
    .order('created_at', { ascending: false });

  return NextResponse.json({ subscriptions: data || [] });
}
