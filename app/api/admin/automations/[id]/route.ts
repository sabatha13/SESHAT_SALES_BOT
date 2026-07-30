import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status      !== undefined) updates.status      = body.status;
    if (body.name        !== undefined) updates.name        = body.name;
    if (body.description !== undefined) updates.description = body.description;

    const { data, error } = await supabase
      .from('marketing_automations')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
