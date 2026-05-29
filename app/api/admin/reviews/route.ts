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
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { data } = await supabase
    .from('reviews')
    .select('*, profile:profiles(email, full_name), book:books(title)')
    .order('created_at', { ascending: false });

  return NextResponse.json({ reviews: data || [] });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id, is_approved } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  await supabase.from('reviews').update({ is_approved }).eq('id', id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  await supabase.from('reviews').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
