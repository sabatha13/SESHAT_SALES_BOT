import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

async function isAdmin(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  return data?.is_admin === true;
}

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase.from('author_profiles').select('*').eq('slug', 'le-comte-de-sabatha').single();
  return NextResponse.json(data || {});
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) return new NextResponse('Unauthorized', { status: 401 });
  const body = await req.json();
  const supabase = createServerClient();
  const { data, error } = await supabase.from('author_profiles').update({ bio: body.bio, favorite_quote: body.favorite_quote, photo_url: body.photo_url, updated_at: new Date().toISOString() }).eq('slug', 'le-comte-de-sabatha').select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
