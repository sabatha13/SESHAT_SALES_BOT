import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import BookCard from '@/components/books/BookCard';
import { Book } from '@/lib/types';
import { BookOpen, ShoppingBag } from 'lucide-react';

async function getUserLibrary(clerkUserId: string): Promise<Book[]> {
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (!profile) return [];

  const { data } = await supabase
    .from('purchases')
    .select('books(*)')
    .eq('user_id', profile.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  return (data?.map((p: any) => p.books).filter(Boolean) as Book[]) || [];
}

async function ensureProfile(clerkUserId: string, email: string, fullName: string | null) {
  const supabase = createServerClient();
  await supabase.from('profiles').upsert(
    { clerk_user_id: clerkUserId, email, full_name: fullName },
    { onConflict: 'clerk_user_id', ignoreDuplicates: false }
  );
}

export default async function BibliothequePage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const fullName = user?.fullName || null;

  await ensureProfile(userId, email, fullName);
  const books = await getUserLibrary(userId);

  return (
    <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Espace personnel</p>
        <h1 className="section-title">Ma Bibliothèque</h1>
        <div className="divider-gold mt-4" style={{ margin: '1rem 0 0 0', marginLeft: 0 }} />
        {user && (
          <p className="text-silver-500 text-sm mt-4">
            Bienvenue, <span className="text-silver-300">{user.firstName || email}</span> —
            {' '}{books.length} livre{books.length !== 1 ? 's' : ''} dans votre collection
          </p>
        )}
      </div>

      {books.length === 0 ? (
        <div className="text-center py-24 card-dark rounded-3xl max-w-md mx-auto">
          <BookOpen className="w-14 h-14 text-gold-700/40 mx-auto mb-5" />
          <h2 className="font-serif text-2xl text-silver-300 mb-3">Votre bibliothèque est vide</h2>
          <p className="text-silver-500 text-sm mb-8">
            Explorez notre boutique et acquérez votre premier livre ésotérique.
          </p>
          <Link href="/boutique" className="btn-gold px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm">
            <ShoppingBag className="w-4 h-4" />
            Visiter la boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {books.map(book => (
            <BookCard key={book.id} book={book} owned />
          ))}
        </div>
      )}
    </div>
  );
}
