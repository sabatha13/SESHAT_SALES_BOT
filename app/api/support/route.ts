export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

  await resend.emails.send({
    from: 'CDS Librairie <onboarding@resend.dev>',
    to: 'technoreport2015@gmail.com',
    subject: `[Contact] ${subject}`,
    html: `<p><strong>De:</strong> ${email}</p><p><strong>Sujet:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
  });

  await resend.emails.send({
    from: 'CDS Librairie <onboarding@resend.dev>',
    to: email,
    subject: 'Nous avons bien reçu votre message',
    html: '<p>ALUTRELI,</p><p>Nous avons bien reçu votre message concernant : <strong>' + subject + '</strong>.</p><p>Notre équipe vous répond sous 24-48h.</p><p>Merci de votre confiance.</p><p><em>CDS Librairie Ésotérique</em></p>',
  });

  return NextResponse.json({ ok: true });
}