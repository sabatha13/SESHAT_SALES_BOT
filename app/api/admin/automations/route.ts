import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

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
    const { name, description, status, trigger_type, campaign_id, delay_minutes, conditions, metadata } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    if (!trigger_type)  return NextResponse.json({ error: 'Déclencheur requis' }, { status: 400 });

    const { data, error } = await supabase
      .from('marketing_automations')
      .insert({
        name:          name.trim(),
        description:   description?.trim() ?? null,
        status:        status ?? 'draft',
        trigger_type,
        campaign_id:   campaign_id || null,
        delay_minutes: delay_minutes ?? 0,
        conditions:    conditions ?? [],
        metadata:      metadata ?? {},
        created_by:    userId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
