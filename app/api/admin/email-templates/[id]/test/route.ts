import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SAMPLE_VALUES: Record<string, string> = {
  reader_name:     'Sophie Martin',
  reader_email:    'sophie@exemple.fr',
  book_title:      'Les Mystères du Cosmos',
  book_price:      '14,99 €',
  book_url:        'https://cdslibrairie.com/livre/exemple',
  coupon_code:     'LECTEUR20',
  coupon_discount: '20',
  campaign_name:   'Newsletter Juillet 2026',
  site_url:        'https://cdslibrairie.com',
  cds_name:        'CDS Librairie',
  unsubscribe_url: 'https://cdslibrairie.com/desabonnement',
};

function substituteVariables(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const to = (body.to as string)?.trim();
    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
    }

    const { data: template, error } = await supabase
      .from('marketing_email_templates')
      .select('name, subject, html_body')
      .eq('id', params.id)
      .single();

    if (error || !template) return NextResponse.json({ error: 'Template introuvable' }, { status: 404 });

    const html    = substituteVariables(template.html_body as string, SAMPLE_VALUES);
    const subject = substituteVariables(template.subject   as string, SAMPLE_VALUES);

    const { error: sendError } = await resend.emails.send({
      from:    'CDS Librairie <noreply@cdslibrairie.com>',
      to,
      subject: `[TEST] ${subject}`,
      html,
    });

    if (sendError) {
      return NextResponse.json({ error: (sendError as any).message ?? 'Erreur d\'envoi' }, { status: 500 });
    }
    return NextResponse.json({ success: true, to });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
