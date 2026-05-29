export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServerClient();
  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!admin?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { data } = await supabase
    .from('downloads')
    .select('*, profile:profiles(email, full_name), book:books(title)')
    .order('created_at', { ascending: false })
    .limit(200);

  return NextResponse.json({ downloads: data || [] });
}
