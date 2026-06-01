import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json();
  const { id, name, title, photo_url, intro, biography, specializations, publications, affiliations, languages } = body;

  const { error } = await supabase
    .from('author_profile')
    .update({ name, title, photo_url, intro, biography, specializations, publications, affiliations, languages, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
