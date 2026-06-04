import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerClient();

  // Check admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_user_id', userId)
    .single();
  if (!adminProfile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const profileId = params.id;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, clerk_user_id, last_seen_at, created_at, email, full_name')
    .eq('id', profileId)
    .single();

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Fetch wishlist
  const { data: wishlist } = await supabase
    .from('wishlist')
    .select('id, created_at, book:books(id, title, cover_url, category)')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, created_at, rating, comment, is_approved, book:books(id, title)')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  // Fetch reading sessions
  const { data: readerSessions } = await supabase
    .from('reader_sessions')
    .select('id, current_page, total_pages, last_read_at, completed, book:books(id, title, cover_url)')
    .eq('user_id', profileId)
    .order('last_read_at', { ascending: false });

  // Fetch downloads
  const { data: downloads } = await supabase
    .from('downloads')
    .select('id, created_at, book:books(id, title)')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  // Fetch all subscriptions (history)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_start, current_period_end, created_at, stripe_subscription_id')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  // Fetch Clerk data
  let clerkData: { lastSignInAt: number | null; createdAt: number | null; sessionCount: number } = {
    lastSignInAt: null,
    createdAt: null,
    sessionCount: 0,
  };

  if (profile.clerk_user_id) {
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(profile.clerk_user_id);
      clerkData.lastSignInAt = clerkUser.lastSignInAt ?? null;
      clerkData.createdAt = clerkUser.createdAt ?? null;

      try {
        const sessions = await clerk.sessions.getSessionList({ userId: profile.clerk_user_id });
        clerkData.sessionCount = Array.isArray(sessions) ? sessions.length : (sessions as any)?.data?.length ?? 0;
      } catch {
        // sessions endpoint may not be available
      }
    } catch {
      // Clerk user may not exist
    }
  }

  return NextResponse.json({
    profile,
    wishlist: wishlist || [],
    reviews: reviews || [],
    readerSessions: readerSessions || [],
    downloads: downloads || [],
    subscriptions: subscriptions || [],
    clerkData,
  });
}
