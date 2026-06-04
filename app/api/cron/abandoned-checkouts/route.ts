import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const { data: abandoned } = await supabase
    .from('purchases')
    .select('id, user_id, book_id, created_at, user:profiles(email, full_name), book:books(id, title, author, short_description, price, cover_url)')
    .eq('status', 'pending')
    .is('recovery_email_sent_at', null)
    .lte('created_at', twoHoursAgo.toISOString())
    .gte('created_at', fortyEightHoursAgo.toISOString());

  if (!abandoned || abandoned.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  let sent = 0;
  for (const purchase of abandoned) {
    try {
      const user = purchase.user as any;
      const book = purchase.book as any;
      if (!user?.email || !book) continue;

      // Skip if the user has since completed a purchase of this same book.
      const { data: completed } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', purchase.user_id)
        .eq('book_id', purchase.book_id)
        .eq('status', 'completed')
        .limit(1);

      if (completed && completed.length > 0) continue;

      const bookUrl = `https://cdslibrairie.com/livre/${book.id}`;
      const priceText = `${(book.price / 100).toFixed(2)} $US`;

      const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#0D0D0F;">

    <div style="background:linear-gradient(135deg,#1a1408,#0D0D0F);padding:40px 32px;text-align:center;border-bottom:1px solid #C9A84C40;">
      <p style="color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">CDS Librairie Ésotérique</p>
      <h1 style="color:#E8E0D0;font-size:24px;margin:0;font-weight:normal;">Votre livre vous attend encore…</h1>
    </div>

    <div style="padding:40px 32px;">
      <p style="color:#C0B8A8;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Bonjour ${user.full_name || 'cher lecteur'},
      </p>
      <p style="color:#C0B8A8;font-size:15px;line-height:1.7;margin:0 0 28px;">
        Il y a quelques heures, un ouvrage a retenu votre regard, puis le voile est retombé avant que vous ne le fassiez vôtre. Sachez qu'il repose toujours, patient, là où vous l'avez laissé.
      </p>

      <div style="background:#1C1C1F;border:1px solid #C9A84C30;border-radius:12px;padding:24px;margin-bottom:28px;">
        ${book.cover_url ? `<div style="text-align:center;margin-bottom:20px;"><img src="${book.cover_url}" alt="${book.title}" style="max-width:160px;border-radius:8px;box-shadow:0 8px 32px rgba(201,168,76,0.2);" /></div>` : ''}
        <h2 style="color:#E8E0D0;font-size:20px;margin:0 0 6px;font-weight:normal;text-align:center;">${book.title}</h2>
        <p style="color:#8E8E95;font-size:14px;margin:0 0 12px;text-align:center;">par ${book.author}</p>
        ${book.short_description ? `<p style="color:#C0B8A8;font-size:14px;line-height:1.7;margin:0 0 16px;text-align:center;">${book.short_description}</p>` : ''}
        <p style="color:#C9A84C;font-size:18px;font-weight:bold;margin:0;text-align:center;">${priceText}</p>
      </div>

      <p style="color:#C0B8A8;font-size:15px;line-height:1.7;margin:0 0 28px;">
        Certains livres ne se présentent qu'une fois ; les laisser passer, c'est parfois manquer le seuil. Reprenez là où le fil s'est rompu — votre lecture n'attend qu'un geste.
      </p>

      <div style="text-align:center;">
        <a href="${bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#a8863c);color:#0D0D0F;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">
          Reprendre ma lecture →
        </a>
      </div>

      <p style="color:#8E8E95;font-size:14px;line-height:1.7;margin:32px 0 0;text-align:right;font-style:italic;">
        Le Comte de Sabatha
      </p>
    </div>

    <div style="padding:24px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="color:#4a4a50;font-size:12px;margin:0;">CDS Librairie Ésotérique · <a href="https://cdslibrairie.com" style="color:#4a4a50;">cdslibrairie.com</a></p>
    </div>
  </div>
</body>
</html>`;

      await resend.emails.send({
        from: 'CDS Librairie <noreply@cdslibrairie.com>',
        to: user.email,
        subject: 'Votre livre vous attend encore…',
        html,
      });

      await supabase
        .from('purchases')
        .update({ recovery_email_sent_at: new Date().toISOString() })
        .eq('id', purchase.id);

      sent++;
    } catch (err) {
      console.error('abandoned-checkouts: failed to process purchase', purchase.id, err);
    }
  }

  return NextResponse.json({ success: true, sent });
}
