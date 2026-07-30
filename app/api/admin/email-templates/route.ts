import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_user_id', userId)
      .single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const { data, error } = await supabase
      .from('marketing_email_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_user_id', userId)
      .single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { name, description, category, subject, html_body, text_body, variables, status, metadata } = body;

    if (!name?.trim())    return NextResponse.json({ error: 'Nom requis' },   { status: 400 });
    if (!subject?.trim()) return NextResponse.json({ error: 'Sujet requis' }, { status: 400 });

    const { data, error } = await supabase
      .from('marketing_email_templates')
      .insert({
        name:        name.trim(),
        description: description?.trim() ?? null,
        category:    category ?? 'general',
        subject:     subject.trim(),
        html_body:   html_body ?? '',
        text_body:   text_body?.trim() ?? null,
        variables:   variables ?? [],
        status:      status ?? 'draft',
        created_by:  userId,
        metadata:    metadata ?? {},
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
