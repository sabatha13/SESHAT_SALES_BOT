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

  const { book_ids } = await req.json();
  if (!Array.isArray(book_ids) || book_ids.length === 0)
    return NextResponse.json({ error: 'Aucun livre sélectionné' }, { status: 400 });

  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, short_description, price, cover_url, category')
    .in('id', book_ids);

  if (!books || books.length === 0)
    return NextResponse.json({ error: 'Livres introuvables' }, { status: 404 });

  const { data: users } = await supabase
    .from('profiles')
    .select('email, full_name')
    .not('email', 'is', null)
    .neq('email', '');
  if (!users || users.length === 0)
    return NextResponse.json({ error: 'Aucun utilisateur' }, { status: 400 });

  const booksHtml = books.map(book => {
    const bookUrl = `https://cdslibrairie.com/livre/${book.id}`;
    const priceText = `${(book.price / 100).toFixed(2)} $US`;
    return `
      <div style="background:#1C1C1F;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:20px;">
        ${book.cover_url ? `<div style="text-align:center;margin-bottom:20px;"><img src="${book.cover_url}" alt="${book.title}" style="max-width:160px;border-radius:8px;box-shadow:0 8px 32px rgba(201,168,76,0.2);" /></div>` : ''}
        <p style="color:#C9A84C;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">${book.category}</p>
        <h2 style="color:#E8E0D0;font-size:20px;margin:0 0 6px;font-weight:normal;">${book.title}</h2>
        <p style="color:#8E8E95;font-size:14px;margin:0 0 12px;">par ${book.author}</p>
        <p style="color:#C0B8A8;font-size:14px;line-height:1.7;margin:0 0 16px;">${book.short_description}</p>
        <p style="color:#C9A84C;font-size:18px;font-weight:bold;margin:0 0 16px;">${priceText}</p>
        <a href="${bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#a8863c);color:#0D0D0F;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">Découvrir →</a>
      </div>`;
  }).join('');

  const subject = books.length === 1
    ? `📖 Nouveau livre : ${books[0].title}`
    : `📚 ${books.length} nouveaux livres disponibles — CDS Librairie`;

  const BATCH = 50;
  let sent = 0;
  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH);
    await Promise.all(batch.map(user => {
      const greeting = `Bonjour ${user.full_name || 'cher lecteur'}`;
      const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#0D0D0F;">
    <div style="background:linear-gradient(135deg,#1a1408,#0D0D0F);padding:40px 32px;text-align:center;border-bottom:1px solid #C9A84C40;">
      <p style="color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">CDS Librairie Ésotérique</p>
      <h1 style="color:#E8E0D0;font-size:26px;margin:0;font-weight:normal;">${books.length === 1 ? 'Nouveau livre disponible' : `${books.length} nouveaux livres disponibles`}</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#C0B8A8;font-size:15px;margin:0 0 28px;">${greeting},</p>
      ${booksHtml}
    </div>
    <div style="padding:24px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="color:#4a4a50;font-size:12px;margin:0;">CDS Librairie Ésotérique · <a href="https://cdslibrairie.com" style="color:#4a4a50;">cdslibrairie.com</a></p>
    </div>
  </div>
</body>
</html>`;
      return resend.emails.send({
        from: 'CDS Librairie <noreply@cdslibrairie.com>',
        to: user.email,
        subject,
        html,
      });
    }));
    sent += batch.length;
  }

  return NextResponse.json({ success: true, sent });
}
