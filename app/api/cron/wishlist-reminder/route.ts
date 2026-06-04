import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_url: string | null;
  is_published: boolean;
}

interface Profile {
  email: string;
  full_name: string | null;
}

interface WishlistEntry {
  book_id: string;
  user_id: string;
  book: Book | null;
  profile: Profile | null;
}

interface UserWishlist {
  user_id: string;
  profile: Profile;
  books: Book[];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  // Fetch all wishlist entries joined with book and profile
  const { data: entries, error } = await supabase
    .from('wishlist')
    .select(
      'book_id, user_id, book:books(id, title, author, price, cover_url, is_published), profile:profiles(email, full_name)'
    );

  if (error) {
    console.error('wishlist-reminder: failed to fetch wishlist entries', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  // Determine which users have already received a reminder in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Collect unique user_ids
  const allUserIds = [...new Set((entries as WishlistEntry[]).map(e => e.user_id))];

  // Fetch wishlist_email_sent_at for these profiles; handle gracefully if column doesn't exist
  let recentlySentUserIds = new Set<string>();
  try {
    const { data: profilesSentAt } = await supabase
      .from('profiles')
      .select('clerk_user_id, wishlist_email_sent_at')
      .in('clerk_user_id', allUserIds)
      .gte('wishlist_email_sent_at', sevenDaysAgo);

    if (profilesSentAt) {
      for (const p of profilesSentAt as Array<{ clerk_user_id: string; wishlist_email_sent_at: string | null }>) {
        if (p.wishlist_email_sent_at) {
          recentlySentUserIds.add(p.clerk_user_id);
        }
      }
    }
  } catch {
    // Column may not exist yet; proceed sending to everyone
    console.warn('wishlist-reminder: could not query wishlist_email_sent_at — sending to all users');
  }

  // Group entries by user, keeping only published books, skipping recently-emailed users
  const byUser = new Map<string, UserWishlist>();

  for (const entry of entries as WishlistEntry[]) {
    const { user_id, book, profile } = entry;

    if (!book || !book.is_published) continue;
    if (!profile?.email) continue;
    if (recentlySentUserIds.has(user_id)) continue;

    if (!byUser.has(user_id)) {
      byUser.set(user_id, { user_id, profile, books: [] });
    }
    byUser.get(user_id)!.books.push(book);
  }

  let sent = 0;
  let skipped = entries.length - byUser.size;

  const now = new Date().toISOString();

  for (const { user_id, profile, books } of byUser.values()) {
    if (books.length === 0) {
      skipped++;
      continue;
    }

    try {
      const firstName = profile.full_name?.split(' ')[0] || 'cher lecteur';

      const booksHtml = books
        .map(book => {
          const bookUrl = `https://cdslibrairie.com/livre/${book.id}`;
          const priceText = `${(book.price / 100).toFixed(2)} $US`;
          return `
        <div style="background:#1C1C1F;border:1px solid #C9A84C30;border-radius:12px;padding:24px;margin-bottom:20px;">
          ${
            book.cover_url
              ? `<div style="text-align:center;margin-bottom:20px;">
              <img src="${book.cover_url}" alt="${book.title}" style="max-width:140px;border-radius:8px;box-shadow:0 8px 32px rgba(201,168,76,0.2);" />
            </div>`
              : ''
          }
          <h2 style="color:#E8E0D0;font-size:20px;margin:0 0 6px;font-weight:normal;text-align:center;font-family:Georgia,serif;">${book.title}</h2>
          <p style="color:#8E8E95;font-size:14px;margin:0 0 16px;text-align:center;">par ${book.author}</p>
          <p style="color:#C9A84C;font-size:18px;font-weight:bold;margin:0 0 20px;text-align:center;">${priceText}</p>
          <div style="text-align:center;">
            <a href="${bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#a8863c);color:#0D0D0F;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:1px;">Découvrir →</a>
          </div>
        </div>`;
        })
        .join('');

      const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#0D0D0F;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1408,#0D0D0F);padding:40px 32px;text-align:center;border-bottom:1px solid #C9A84C40;">
      <p style="color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px;">CDS Librairie Ésotérique</p>
      <h1 style="color:#E8E0D0;font-size:26px;margin:0;font-weight:normal;font-family:Georgia,serif;">Vos livres vous attendent</h1>
      <p style="color:#C9A84C;font-size:20px;margin:8px 0 0;">✦</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">
      <p style="color:#C0B8A8;font-size:16px;line-height:1.8;margin:0 0 12px;">
        Bonjour ${firstName},
      </p>
      <p style="color:#C0B8A8;font-size:15px;line-height:1.8;margin:0 0 32px;">
        Certains ouvrages ont retenu votre attention et patientent dans votre liste de souhaits. Le savoir ésotérique ne se laisse pas toujours attendre — voici vos livres, prêts à vous rejoindre.
      </p>

      ${booksHtml}

      <p style="color:#8E8E95;font-size:14px;line-height:1.7;margin:32px 0 0;text-align:right;font-style:italic;">
        Le Comte de Sabatha
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="color:#4a4a50;font-size:12px;margin:0 0 6px;">
        Vous recevez cet email car vous avez ajouté des livres à votre liste de souhaits sur CDS Librairie Ésotérique.
      </p>
      <p style="color:#4a4a50;font-size:12px;margin:0;">
        CDS Librairie Ésotérique · <a href="https://cdslibrairie.com" style="color:#4a4a50;text-decoration:underline;">cdslibrairie.com</a>
      </p>
    </div>

  </div>
</body>
</html>`;

      await resend.emails.send({
        from: 'CDS Librairie <noreply@cdslibrairie.com>',
        to: profile.email,
        subject: `✦ Vos livres vous attendent, ${firstName}`,
        html,
      });

      // Update wishlist_email_sent_at on the profile
      await supabase
        .from('profiles')
        .update({ wishlist_email_sent_at: now })
        .eq('clerk_user_id', user_id);

      sent++;
    } catch (err) {
      console.error('wishlist-reminder: failed to process user', user_id, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
