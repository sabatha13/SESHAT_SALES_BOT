export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { BookAccessInfo } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  const supabase = createServerClient();

  const { data: book } = await supabase
    .from('books')
    .select('id, access_type, download_allowed, subscription_included, is_published')
    .eq('id', params.id)
    .single();

  if (!book || !book.is_published) {
    return NextResponse.json({ canRead: false, canDownload: false, accessType: 'none' } as BookAccessInfo);
  }

  if (book.access_type === 'free_preview') {
    return NextResponse.json({ canRead: true, canDownload: false, accessType: 'free_preview' } as BookAccessInfo);
  }

  if (!userId) {
    return NextResponse.json({ canRead: false, canDownload: false, accessType: 'none' } as BookAccessInfo);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile) {
    return NextResponse.json({ canRead: false, canDownload: false, accessType: 'none' } as BookAccessInfo);
  }

  // Check purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', profile.id)
    .eq('book_id', params.id)
    .eq('status', 'completed')
    .single();

  if (purchase) {
    return NextResponse.json({
      canRead: true,
      canDownload: book.download_allowed,
      accessType: 'purchased',
    } as BookAccessInfo);
  }

  // Check subscription
  if (book.subscription_included || book.access_type === 'subscription_only' || book.access_type === 'purchase_and_subscription') {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .single();

    if (sub) {
      return NextResponse.json({
        canRead: true,
        canDownload: false,
        accessType: 'subscription',
      } as BookAccessInfo);
    }
  }

  return NextResponse.json({ canRead: false, canDownload: false, accessType: 'none' } as BookAccessInfo);
}
