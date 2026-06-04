export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = 'https://www.cdslibrairie.com';

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 });

  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') || '',
    'svix-timestamp': req.headers.get('svix-timestamp') || '',
    'svix-signature': req.headers.get('svix-signature') || '',
  };

  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerClient();
  const data = event.data;

  if (event.type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address || '';
    const full_name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const avatar_url = data.image_url || null;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', data.id)
      .single();

    if (!existing) {
      await supabase.from('profiles').insert({
        clerk_user_id: data.id,
        email,
        full_name,
        avatar_url,
      });
    }

    // Send welcome email
    if (email) {
      const firstName = data.first_name || 'Cher(e) Initié(e)';
      await resend.emails.send({
        from: 'CDS Librairie Ésotérique <noreply@cdslibrairie.com>',
        to: email,
        subject: `✦ Bienvenue dans le Cercle, ${firstName}`,
        html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:Georgia,serif;color:#E8E0D0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0F;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #2a2a2e;border-radius:16px;overflow:hidden;max-width:600px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a1608,#0D0D0F);padding:40px 40px 30px;text-align:center;border-bottom:1px solid #C9A84C33;">
          <p style="color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px;">✦ CDS LIBRAIRIE ÉSOTÉRIQUE ✦</p>
          <h1 style="color:#E8E0D0;font-size:28px;font-weight:normal;margin:0;line-height:1.3;">Bienvenue dans le Cercle,<br><span style="color:#C9A84C;">${firstName}</span></h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#C0B8A8;font-size:16px;line-height:1.8;margin:0 0 20px;font-style:italic;">Vous venez de franchir le seuil.</p>
          <p style="color:#C0B8A8;font-size:15px;line-height:1.8;margin:0 0 20px;">Bienvenue dans la bibliothèque numérique du <strong style="color:#E8E0D0;">Comte de Sabatha</strong> — un espace réservé à ceux qui cherchent au-delà des apparences.</p>
          <p style="color:#C0B8A8;font-size:15px;line-height:1.8;margin:0 0 32px;">Ici, vous trouverez des œuvres sur la <strong style="color:#C9A84C;">Magie</strong>, la <strong style="color:#C9A84C;">Kabbale</strong>, l'<strong style="color:#C9A84C;">Alchimie</strong>, l'<strong style="color:#C9A84C;">Hermétisme</strong>, le <strong style="color:#C9A84C;">Vodou</strong> et bien d'autres traditions ésotériques — soigneusement rédigées pour éveiller, instruire et transformer.</p>

          <!-- CTAs -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr>
              <td style="padding:6px;">
                <a href="${APP_URL}/boutique" style="display:block;background:linear-gradient(135deg,#C9A84C,#a8863c);color:#0D0D0F;text-align:center;padding:14px 20px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">📚 Explorer la Boutique →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:6px;">
                <a href="${APP_URL}/chemin" style="display:block;background:#1C1C1F;border:1px solid #C9A84C55;color:#C9A84C;text-align:center;padding:14px 20px;border-radius:10px;text-decoration:none;font-size:14px;letter-spacing:1px;">🔮 Trouver ma Voie (Quiz) →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:6px;">
                <a href="${APP_URL}/abonnement" style="display:block;background:#1C1C1F;border:1px solid #C9A84C55;color:#C9A84C;text-align:center;padding:14px 20px;border-radius:10px;text-decoration:none;font-size:14px;letter-spacing:1px;">👑 Rejoindre le Cercle des Initiés →</a>
              </td>
            </tr>
          </table>

          <!-- Citation -->
          <div style="border-left:3px solid #C9A84C;padding:16px 20px;margin:32px 0;background:#1a1608;">
            <p style="color:#C0B8A8;font-size:15px;font-style:italic;margin:0 0 8px;line-height:1.7;">"La connaissance véritable ne s'achète pas — elle se mérite par la constance de la quête."</p>
            <p style="color:#8E8E95;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">— Le Comte de Sabatha</p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #2a2a2e;text-align:center;">
          <p style="color:#555560;font-size:12px;margin:0;line-height:1.6;">Vous recevez cet email car vous venez de créer un compte sur<br><a href="${APP_URL}" style="color:#C9A84C;text-decoration:none;">cdslibrairie.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }).catch(() => {}); // Don't fail the webhook if email fails
    }
  }

  if (event.type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address || '';
    const full_name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const avatar_url = data.image_url || null;

    await supabase
      .from('profiles')
      .update({ email, full_name, avatar_url })
      .eq('clerk_user_id', data.id);
  }

  return NextResponse.json({ success: true });
}
