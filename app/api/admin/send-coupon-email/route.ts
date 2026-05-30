import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { coupon_code, discount_percent, expires_at, book_titles } = await req.json();

  const { data: users } = await supabase.from('profiles').select('email, full_name');
  if (!users || users.length === 0) return NextResponse.json({ error: 'Aucun utilisateur' }, { status: 400 });

  const expiryText = expires_at
    ? `<p>⏳ Valable jusqu'au <strong>${new Date(expires_at).toLocaleDateString('fr-FR')}</strong></p>`
    : '';
  const bookText = book_titles?.length
    ? `<p>📚 Applicable sur : <strong>${book_titles.join(', ')}</strong></p>`
    : '<p>📚 Applicable sur tous les livres</p>';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#e5e7eb;padding:40px;border-radius:12px;">
      <h1 style="color:#d4a843;font-size:28px;margin-bottom:8px;">✨ Offre spéciale pour vous</h1>
      <p style="color:#9ca3af;margin-bottom:32px;">CDS Librairie Ésotérique</p>
      <p>Utilisez le code promo ci-dessous pour bénéficier de <strong style="color:#d4a843">${discount_percent}% de réduction</strong> :</p>
      <div style="background:#1a1a1a;border:2px dashed #d4a843;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
        <span style="font-family:monospace;font-size:32px;color:#d4a843;letter-spacing:4px;">${coupon_code}</span>
      </div>
      ${bookText}
      ${expiryText}
      <p style="margin-top:32px;color:#9ca3af;font-size:12px;">Vous recevez cet email car vous êtes inscrit sur CDS Librairie Ésotérique.</p>
    </div>
  `;

  const emails = users.map(u => u.email).filter(Boolean);
  const batchSize = 50;
  let sent = 0;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    await Promise.all(batch.map(email =>
      resend.emails.send({
        from: 'CDS Librairie <onboarding@resend.dev>',
        to: email,
        subject: `🎁 Code promo ${coupon_code} — ${discount_percent}% de réduction`,
        html,
      })
    ));
    sent += batch.length;
  }

  return NextResponse.json({ sent });
}
