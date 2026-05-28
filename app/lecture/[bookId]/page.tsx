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
  const { data } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(pdfPath, 3600); // 1 hour expiry
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

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', profile.id)
    .eq('book_id', bookId)
    .eq('status', 'completed')
    .single();

  if (!purchase) return null;

  const { data: book } = await supabase
    .from('books')
    .select('id, title, pdf_path')
    .eq('id', bookId)
    .single();

  return book;
}

export default async function LecturePage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const book = await verifyAccess(userId, params.bookId);
  if (!book) notFound();

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || userId;

  const pdfUrl = await getSignedPdfUrl(book.pdf_path);
  if (!pdfUrl) notFound();

  return (
    <div className="flex flex-col h-screen bg-void">
      {/* Minimal header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-obsidian border-b border-ash/50 shrink-0">
        <Link href="/bibliotheque" className="flex items-center gap-1.5 text-silver-500 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Bibliothèque</span>
        </Link>
        <div className="w-px h-4 bg-ash" />
        <h1 className="font-serif text-sm text-silver-300 truncate">{book.title}</h1>
      </div>

      {/* PDF Reader — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <PDFReader
          pdfUrl={pdfUrl}
          userEmail={email}
          bookTitle={book.title}
        />
      </div>
    </div>
  );
}
