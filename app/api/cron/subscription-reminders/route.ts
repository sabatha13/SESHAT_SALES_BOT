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
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in3DaysStart = new Date(in3Days);
  in3DaysStart.setHours(0, 0, 0, 0);
  const in3DaysEnd = new Date(in3Days);
  in3DaysEnd.setHours(23, 59, 59, 999);

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, current_period_end, user:profiles(email, full_name)')
    .eq('status', 'active')
    .gte('current_period_end', in3DaysStart.toISOString())
    .lte('current_period_end', in3DaysEnd.toISOString());

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  let sent = 0;
  for (const sub of subscriptions) {
    const user = sub.user as any;
    if (!user?.email) continue;

    const expiryDate = new Date(sub.current_period_end).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#0D0D0F;">

    <div style="background:linear-gradient(135deg,#1a1408,#0D0D0F);padding:40px 32px;text-align:center;border-bottom:1px solid #C9A84C40;">
      <p style="color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">CDS Librairie Ésotérique</p>
      <h1 style="color:#E8E0D0;font-size:24px;margin:0;font-weight:normal;">Votre abonnement expire bientôt</h1>
    </div>

    <div style="padding:40px 32px;">
      <p style="color:#C0B8A8;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Bonjour ${user.full_name || 'cher lecteur'},
      </p>
      <p style="color:#C0B8A8;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Votre abonnement à <strong style="color:#E8E0D0;">CDS Librairie Ésotérique</strong> expire le <strong style="color:#C9A84C;">${expiryDate}</strong>, soit dans <strong style="color:#C9A84C;">3 jours</strong>.
      </p>

      <div style="background:#1C1C1F;border:1px solid #C9A84C30;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
        <p style="color:#8E8E95;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Expiration</p>
        <p style="color:#C9A84C;font-size:22px;font-weight:bold;margin:0;">${expiryDate}</p>
      </div>

      <p style="color:#C0B8A8;font-size:15px;line-height:1.7;margin:0 0 28px;">
        Pour continuer à accéder à toute la bibliothèque ésotérique, renouvelez votre abonnement avant cette date.
      </p>

      <div style="text-align:center;">
        <a href="https://cdslibrairie.com/abonnement" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#a8863c);color:#0D0D0F;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">
          Renouveler mon abonnement →
        </a>
      </div>
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
      subject: `⚠️ Votre abonnement expire dans 3 jours — ${expiryDate}`,
      html,
    });
    sent++;
  }

  return NextResponse.json({ success: true, sent });
}
