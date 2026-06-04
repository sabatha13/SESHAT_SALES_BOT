export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  return data?.is_admin === true;
}

function slugify(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { data: bundles } = await supabase
    .from('bundles')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ bundles: bundles || [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json();
  const { title, description, book_ids, price, cover_url, is_published } = body;
  if (!title) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });

  const { data: bundle, error } = await supabase
    .from('bundles')
    .insert({
      title,
      slug: slugify(title),
      description: description || '',
      book_ids: Array.isArray(book_ids) ? book_ids : [],
      price: Math.round(Number(price) * 100),
      cover_url: cover_url || '',
      is_published: !!is_published,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bundle });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json();
  const { id, title, description, book_ids, price, cover_url, is_published } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { data: bundle, error } = await supabase
    .from('bundles')
    .update({
      title,
      slug: slugify(title),
      description: description || '',
      book_ids: Array.isArray(book_ids) ? book_ids : [],
      price: Math.round(Number(price) * 100),
      cover_url: cover_url || '',
      is_published: !!is_published,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bundle });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  if (!(await assertAdmin(supabase, userId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await supabase.from('bundles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
