export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { Book } from '@/lib/types';
import { BookOpen, ShoppingBag, Heart, Crown, CheckCircle, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface BookWithProgress extends Book {
  current_page?: number;
  total_pages?: number;
  last_read_at?: string;
  completed?: boolean;
}

async function ensureProfile(clerkUserId: string, email: string, fullName: string | null) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .upsert({ clerk_user_id: clerkUserId, email, full_name: fullName }, { onConflict: 'clerk_user_id', ignoreDuplicates: false })
    .select('id')
    .single();
  return data;
}

async function getLibraryData(profileId: string) {
  const supabase = createServerClient();

  const [purchasesRes, sessionsRes, wishlistRes, subRes] = await Promise.all([
    supabase.from('purchases').select('book:books(*)').eq('user_id', profileId).eq('status', 'completed').order('created_at', { ascending: false }),
    supabase.from('reader_sessions').select('*, book:books(*)').eq('user_id', profileId).order('last_read_at', { ascending: false }),
    supabase.from('wishlist').select('book:books(*)').eq('user_id', profileId).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('status').eq('user_id', profileId).eq('status', 'active').single(),
  ]);

  const purchasedBooks: Book[] = (purchasesRes.data?.map((p: any) => p.book).filter(Boolean) as Book[]) || [];
  const sessions = sessionsRes.data || [];
  const wishlistBooks: Book[] = (wishlistRes.data?.map((w: any) => w.book).filter(Boolean) as Book[]) || [];
  const hasSubscription = !!subRes.data;

  const booksWithProgress: BookWithProgress[] = sessions.map((s: any) => ({
    ...s.book,
    current_page: s.current_page,
    total_pages: s.total_pages,
    last_read_at: s.last_read_at,
    completed: s.completed,
  })).filter((b: any) => b.id);

  const continueReading = booksWithProgress.filter(b => !b.completed && (b.current_page || 0) > 1);
  const completedBooks = booksWithProgress.filter(b => b.completed);

  let subscriptionBooks: Book[] = [];
  if (hasSubscription) {
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('subscription_included', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12);
    subscriptionBooks = (data as Book[]) || [];
  }

  return { purchasedBooks, continueReading, completedBooks, wishlistBooks, subscriptionBooks, hasSubscription };
}

function ProgressBookCard({ book }: { book: BookWithProgress }) {
  const progress = book.total_pages && book.current_page
    ? Math.round((book.current_page / book.total_pages) * 100)
    : 0;

  return (
    <Link href={`/lecture/${book.id}`} className="card-dark rounded-2xl overflow-hidden group hover:border-gold-600/30 border border-ash/30 transition-all">
      <div className="relative aspect-[2/3] bg-charcoal">
        {book.cover_url ? (
          <Image src={book.cover_url} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gold-700/30" />
          </div>
        )}
        {book.completed && (
          <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      {progress > 0 && (
        <div className="h-1 bg-ash/50">
          <div className="h-full bg-gold-gradient transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="p-3">
        <p className="text-silver-200 text-sm font-medium line-clamp-1">{book.title}</p>
        <p className="text-silver-500 text-xs">{book.author}</p>
        {progress > 0 && <p className="text-gold-600 text-xs mt-1">{progress}% lu</p>}
      </div>
    </Link>
  );
}

function SimpleBookCard({ book }: { book: Book }) {
  return (
    <Link href={`/lecture/${book.id}`} className="card-dark rounded-2xl overflow-hidden group hover:border-gold-600/30 border border-ash/30 transition-all">
      <div className="relative aspect-[2/3] bg-charcoal">
        {book.cover_url ? (
          <Image src={book.cover_url} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gold-700/30" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-silver-200 text-sm font-medium line-clamp-1">{book.title}</p>
        <p className="text-silver-500 text-xs">{book.author}</p>
      </div>
    </Link>
  );
}

function Section({ title, icon: Icon, children, empty }: { title: string; icon: any; children?: React.ReactNode; empty?: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-5 h-5 text-gold-400" />
        <h2 className="font-serif text-xl text-silver-200">{title}</h2>
      </div>
      {children || empty}
    </section>
  );
}

export default async function BibliothequePage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const fullName = user?.fullName || null;

  const profile = await ensureProfile(userId, email, fullName);
  if (!profile) redirect('/connexion');

  const { purchasedBooks, continueReading, completedBooks, wishlistBooks, subscriptionBooks, hasSubscription } = await getLibraryData(profile.id);

  return (
    <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="font-serif text-4xl gold-text mb-2">Ma Bibliothèque</h1>
        <p className="text-silver-500">Votre espace de lecture personnel</p>
      </div>

      {continueReading.length > 0 && (
        <Section title="Continuer la lecture" icon={Clock}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {continueReading.slice(0, 6).map(book => <ProgressBookCard key={book.id} book={book} />)}
          </div>
        </Section>
      )}

      <Section
        title="Mes Livres Achetés"
        icon={BookOpen}
        empty={
          <EmptyState
            icon={ShoppingBag}
            title="Aucun livre acheté"
            description="Explorez notre boutique et ajoutez des œuvres ésotériques à votre collection."
            ctaLabel="Visiter la boutique"
            ctaHref="/boutique"
          />
        }
      >
        {purchasedBooks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {purchasedBooks.map(book => <SimpleBookCard key={book.id} book={book} />)}
          </div>
        )}
      </Section>

      {hasSubscription && (
        <Section title="Inclus dans votre abonnement" icon={Crown}>
          {subscriptionBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {subscriptionBooks.map(book => <SimpleBookCard key={book.id} book={book} />)}
            </div>
          ) : (
            <p className="text-silver-500 text-sm">Aucun livre inclus dans l'abonnement pour l'instant.</p>
          )}
        </Section>
      )}

      {!hasSubscription && (
        <div className="card-dark rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-center gap-4">
          <Crown className="w-8 h-8 text-gold-400 flex-shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-silver-200 font-medium">Accédez à des centaines de livres</p>
            <p className="text-silver-500 text-sm">Abonnez-vous pour lire l'ensemble de notre collection ésotérique.</p>
          </div>
          <Link href="/abonnement" className="btn-gold px-5 py-2.5 text-sm flex-shrink-0">
            Voir les abonnements
          </Link>
        </div>
      )}

      <Section
        title="Mes Favoris"
        icon={Heart}
        empty={<p className="text-silver-500 text-sm">Aucun favori pour l'instant.</p>}
      >
        {wishlistBooks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {wishlistBooks.map(book => (
              <Link key={book.id} href={`/livre/${book.id}`} className="card-dark rounded-2xl overflow-hidden group hover:border-gold-600/30 border border-ash/30 transition-all">
                <div className="relative aspect-[2/3] bg-charcoal">
                  {book.cover_url ? (
                    <Image src={book.cover_url} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-gold-700/30" /></div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-silver-200 text-sm font-medium line-clamp-1">{book.title}</p>
                  <p className="text-silver-500 text-xs">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {completedBooks.length > 0 && (
        <Section title="Livres terminés" icon={CheckCircle}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {completedBooks.map(book => <ProgressBookCard key={book.id} book={book} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
