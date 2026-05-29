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

  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ coupons: data || [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json();
  const { code, discount_percent, discount_cents, max_uses, expires_at } = body;
  if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 });

  const { data, error } = await supabase
    .from('coupons')
    .insert({ code: code.toUpperCase(), discount_percent, discount_cents, max_uses, expires_at })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id, is_active } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  await supabase.from('coupons').update({ is_active }).eq('id', id);
  return NextResponse.json({ ok: true });
}
