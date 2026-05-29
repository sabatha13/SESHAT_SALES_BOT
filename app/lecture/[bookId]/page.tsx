import { redirect, notFound } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import PDFReader from '@/components/reader/PDFReader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: { bookId: string };
}

async function getSignedPdfUrl(pdfPath: string): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase.storage.from('pdfs').createSignedUrl(pdfPath, 3600);
  return data?.signedUrl || null;
}

async function verifyAccess(clerkUserId: string, bookId: string) {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (!profile) return null;

  const { data: book } = await supabase
    .from('books')
    .select('id, title, pdf_path, download_allowed, subscription_included, access_type, estimated_reading_minutes')
    .eq('id', bookId)
    .eq('is_published', true)
    .single();

  if (!book) return null;

  if (book.access_type === 'free_preview') {
    return { book, canDownload: false, isSubscriptionAccess: false, profileId: profile.id };
  }

  // Check purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', profile.id)
    .eq('book_id', bookId)
    .eq('status', 'completed')
    .single();

  if (purchase) {
    return { book, canDownload: book.download_allowed, isSubscriptionAccess: false, profileId: profile.id };
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
      return { book, canDownload: false, isSubscriptionAccess: true, profileId: profile.id };
    }
  }

  return null;
}

async function getInitialPage(profileId: string, bookId: string): Promise<number> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('reader_sessions')
    .select('current_page')
    .eq('user_id', profileId)
    .eq('book_id', bookId)
    .single();
  return data?.current_page || 1;
}

export default async function LecturePage({ params }: Props) {
  const { userId } = await auth();

  // Check if book is free_preview — allow without login
  const supabaseCheck = createServerClient();
  const { data: bookCheck } = await supabaseCheck.from('books').select('access_type').eq('id', params.bookId).single();
  const isFreePreview = bookCheck?.access_type === 'free_preview';

  if (!userId && !isFreePreview) redirect('/connexion');

  const access = userId
    ? await verifyAccess(userId, params.bookId)
    : isFreePreview
      ? await (async () => {
          const supabase = createServerClient();
          const { data: book } = await supabase.from('books').select('id, title, pdf_path, download_allowed, subscription_included, access_type, estimated_reading_minutes').eq('id', params.bookId).eq('is_published', true).single();
          return book ? { book, canDownload: false, isSubscriptionAccess: false, profileId: null } : null;
        })()
      : null;

  if (!access) notFound();

  const { book, canDownload, isSubscriptionAccess, profileId } = access;

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || userId || 'visiteur';

  const pdfUrl = `/api/pdf-proxy?bookId=${params.bookId}`;
  const initialPage = profileId ? await getInitialPage(profileId, params.bookId) : 1;

  return (
    <div className="flex flex-col h-screen bg-void">
      <div className="flex items-center gap-4 px-4 py-3 bg-obsidian border-b border-ash/50 shrink-0">
        <Link href="/bibliotheque" className="flex items-center gap-1.5 text-silver-500 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Bibliothèque</span>
        </Link>
        <div className="w-px h-4 bg-ash" />
        <h1 className="font-serif text-sm text-silver-300 truncate">{book.title}</h1>
        {isSubscriptionAccess && (
          <span className="ml-auto text-xs text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">Abonnement</span>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <PDFReader
          pdfUrl={pdfUrl}
          userEmail={email}
          userId={userId}
          bookId={params.bookId}
          bookTitle={book.title}
          canDownload={canDownload}
          isSubscriptionAccess={isSubscriptionAccess}
          initialPage={initialPage}
          estimatedMinutes={book.estimated_reading_minutes}
        />
      </div>
    </div>
  );
}
