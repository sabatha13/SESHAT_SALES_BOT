export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { email, subject, message } = await req.json();
  if (!email || !subject || !message) {
    return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { userId } = await auth();
  let profileId: string | null = null;

  if (userId) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
    profileId = profile?.id || null;
  }

  const { error } = await supabase.from('support_tickets').insert({
    user_id: profileId,
    email,
    subject,
    message,
  });

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
