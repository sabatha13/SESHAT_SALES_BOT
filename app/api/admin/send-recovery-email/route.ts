import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/admin';
import { logPurchaseEvent } from '@/lib/purchase-events';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SPAM_GUARD_HOURS = 24;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await assertAdmin(userId);

    const { purchase_id } = await req.json();
    if (!purchase_id) return NextResponse.json({ error: 'purchase_id requis' }, { status: 400 });

    const supabase = createServerClient();

    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('id, status, book_id, user_id, last_recovery_email_sent_at, recovery_email_count, first_recovery_email_sent_at, profiles(email, full_name), books(title)')
      .eq('id', purchase_id)
      .single();

    if (error || !purchase) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
    }

    if (purchase.status !== 'pending') {
      return NextResponse.json(
        { error: 'Seulement les achats en attente peuvent recevoir un rappel' },
        { status: 400 }
      );
    }

    // Spam guard — 24 h cooldown
    if (purchase.last_recovery_email_sent_at) {
      const hoursSince =
        (Date.now() - new Date(purchase.last_recovery_email_sent_at).getTime()) / (1000 * 60 * 60);
      if (hoursSince < SPAM_GUARD_HOURS) {
        return NextResponse.json(
          { error: 'A recovery email has already been sent within the last 24 hours.' },
          { status: 429 }
        );
      }
    }

    const profile = purchase.profiles as any;
    const book = purchase.books as any;

    if (!profile?.email) {
      return NextResponse.json({ error: 'Email client introuvable' }, { status: 400 });
    }

    const firstName = (profile.full_name || '').split(' ')[0] || 'cher client';
    const bookTitle = book?.title || 'votre livre';
    const bookUrl = `https://cdslibrairie.com/livre/${purchase.book_id}?utm_source=recovery_email`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre livre vous attend</title>
</head>
<body style="margin:0;padding:0;background:#f9f5eb;font-family:'Georgia',serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
    <div style="background:#0d0c08;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:20px;color:#e5a700;letter-spacing:0.04em;font-weight:bold;">CDS Librairie Ésotérique</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;line-height:1.8;">Bonjour ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.8;">
        Nous avons remarqué que votre commande pour :
      </p>
      <div style="margin:20px 0;padding:16px 20px;background:#fef8e8;border-left:4px solid #e5a700;border-radius:4px;">
        <p style="margin:0;font-size:16px;font-weight:bold;color:#1a1a1a;">${bookTitle}</p>
      </div>
      <p style="margin:0 0 20px;font-size:15px;color:#333333;line-height:1.8;">
        n'a pas pu être finalisée.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.8;">
        Vous pouvez terminer votre achat ici :
      </p>
      <div style="text-align:center;margin:24px 0 32px;">
        <a href="${bookUrl}"
          style="display:inline-block;padding:14px 36px;background:#e5a700;color:#0d0c08;text-decoration:none;border-radius:8px;font-size:15px;font-weight:bold;letter-spacing:0.02em;">
          Finaliser mon achat →
        </a>
      </div>
      <p style="margin:0;font-size:14px;color:#666666;line-height:1.7;">
        Si vous rencontrez un problème, répondez simplement à cet email.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f0e8d0;text-align:center;">
      <p style="margin:0;font-size:13px;color:#999999;">Merci,</p>
      <p style="margin:4px 0 0;font-size:13px;color:#999999;font-weight:bold;">CDS Librairie</p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: 'CDS Librairie <noreply@cdslibrairie.com>',
      to: profile.email,
      subject: 'Votre livre vous attend',
      html,
    });

    // Atomic tracking update via RPC — single SQL statement, no read-modify-write race
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.rpc('update_recovery_tracking', {
      p_purchase_id: purchase_id,
      p_sent_at: now,
    });

    if (updateError) {
      console.error('[send-recovery-email] tracking update failed:', updateError.message);
      await logPurchaseEvent({
        event_type: 'recovery_tracking_failed',
        event_source: 'admin',
        purchase_id: purchase.id,
        user_id: purchase.user_id,
        book_id: purchase.book_id,
        metadata: {
          method: 'manual',
          admin_id: userId,
          error: updateError.message,
          utm_source: 'recovery_email',
        },
      });
      return NextResponse.json({ success: true, warning: 'tracking_update_failed' });
    }

    await logPurchaseEvent({
      event_type: 'recovery_email_sent',
      event_source: 'admin',
      purchase_id: purchase.id,
      user_id: purchase.user_id,
      book_id: purchase.book_id,
      metadata: {
        method: 'manual',
        admin_id: userId,
        recovery_email_count: (purchase.recovery_email_count ?? 0) + 1,
        utm_source: 'recovery_email',
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[send-recovery-email]', err?.message ?? err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
