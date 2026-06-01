export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import PurchaseButton from '@/components/books/PurchaseButton';
import WishlistButton from '@/components/books/WishlistButton';
import StarRating from '@/components/ui/StarRating';
import BookCard from '@/components/books/BookCard';
import ReviewForm from './ReviewForm';
import DownloadButton from './DownloadButton';
import { formatPrice, formatDate } from '@/lib/utils';
import { BookOpen, Calendar, FileText, Globe, Tag, Clock, Download, Crown, Lock } from 'lucide-react';
import { Book } from '@/lib/types';

interface Props {
  params: { id: string };
}

async function getBook(id: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();
  return data;
}

async function getRelatedBooks(category: string, excludeId: string): Promise<Book[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('category', category)
    .eq('is_published', true)
    .neq('id', excludeId)
    .limit(4);
  return (data as Book[]) || [];
}

async function getReviews(bookId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('reviews')
    .select('*, profile:profiles(full_name, avatar_url)')
    .eq('book_id', bookId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  return data || [];
}

async function getUserData(clerkUserId: string, bookId: string) {
  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', clerkUserId).single();
  if (!profile) return { owned: false, hasSubscription: false, inWishlist: false };

  const [purchaseRes, subRes, wishlistRes] = await Promise.all([
    supabase.from('purchases').select('id').eq('user_id', profile.id).eq('book_id', bookId).eq('status', 'completed').single(),
    supabase.from('subscriptions').select('id').eq('user_id', profile.id).eq('status', 'active').single(),
    supabase.from('wishlist').select('id').eq('user_id', profile.id).eq('book_id', bookId).single(),
  ]);

  return {
    owned: !!purchaseRes.data,
    hasSubscription: !!subRes.data,
    inWishlist: !!wishlistRes.data,
  };
}

const ACCESS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  purchase_only: { label: 'Achat uniquement', color: 'bg-gold-500/10 text-gold-400 border-gold-500/20', icon: Crown },
  subscription_only: { label: 'Abonnement requis', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Crown },
  purchase_and_subscription: { label: 'Achat ou Abonnement', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Crown },
  free_preview: { label: 'Aperçu gratuit', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: BookOpen },
};

export default async function LivrePage({ params }: Props) {
  const book = await getBook(params.id);
  if (!book) notFound();

  const { userId } = await auth();
  const [userData, reviews, relatedBooks] = await Promise.all([
    userId ? getUserData(userId, book.id) : Promise.resolve({ owned: false, hasSubscription: false, inWishlist: false }),
    getReviews(book.id),
    getRelatedBooks(book.category, book.id),
  ]);

  const { owned, hasSubscription, inWishlist } = userData;
  const canReadViaSubscription = hasSubscription && (book.subscription_included || book.access_type === 'subscription_only' || book.access_type === 'purchase_and_subscription');
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const accessInfo = ACCESS_LABELS[book.access_type] || ACCESS_LABELS.purchase_only;
  const AccessIcon = accessInfo.icon;

  return (
    <div className="min-h-screen py-16 px-4 max-w-6xl mx-auto">
      <Link href="/boutique" className="inline-flex items-center gap-2 text-silver-500 hover:text-gold-400 text-sm transition-colors mb-10">
        ← Retour à la boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Cover */}
        <div className="lg:col-span-2">
          <div className="sticky top-28">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-card-hover border border-ash/50">
              {book.cover_url ? (
                <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-charcoal flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gold-700/30" />
                </div>
              )}
              {/* Wishlist overlay */}
              {userId && (
                <div className="absolute top-3 right-3">
                  <WishlistButton bookId={book.id} initialInWishlist={inWishlist} />
                </div>
              )}
            </div>

            {/* CTA panel */}
            <div className="card-dark p-5 rounded-2xl mt-5 space-y-4">
              <div className="text-center">
                <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">Prix</p>
                {book.access_type !== 'subscription_only' ? (
                  <p className="text-3xl font-serif gold-text">{formatPrice(book.price)}</p>
                ) : (
                  <p className="text-lg font-serif text-purple-400">Abonnement requis</p>
                )}
              </div>

              {/* Access type badge */}
              <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${accessInfo.color}`}>
                <AccessIcon className="w-3 h-3" />
                {accessInfo.label}
              </div>

              {book.access_type === 'free_preview' ? (
                <Link href={`/lecture/${book.id}`} className="btn-gold w-full py-3 flex items-center justify-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  Lire gratuitement
                </Link>
              ) : owned ? (
                <Link href={`/lecture/${book.id}`} className="btn-gold w-full py-3 flex items-center justify-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  Lire maintenant
                </Link>
              ) : canReadViaSubscription ? (
                <Link href={`/lecture/${book.id}`} className="btn-gold w-full py-3 flex items-center justify-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  Lire (inclus dans votre abonnement)
                </Link>
              ) : (
                <div className="space-y-2">
                  {book.access_type !== 'subscription_only' && (
                    <PurchaseButton bookId={book.id} price={book.price} owned={false} />
                  )}
                  {(book.subscription_included || book.access_type === 'subscription_only' || book.access_type === 'purchase_and_subscription') && !owned && (
                    <Link href="/abonnement" className="btn-ghost-gold w-full py-2.5 flex items-center justify-center gap-2 text-sm">
                      <Crown className="w-4 h-4" />
                      S'abonner pour lire
                    </Link>
                  )}
                </div>
              )}

              {owned && <p className="text-center text-emerald-400 text-xs">✓ Vous possédez ce livre</p>}

              {/* Download button */}
              {book.download_allowed && (owned || book.access_type === 'free_preview') ? (
                <DownloadButton bookId={book.id} />
              ) : (
                <div className="flex items-center gap-2 justify-center text-xs pt-2 border-t border-ash/50">
                  {book.download_allowed ? (
                    <><Download className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Téléchargement autorisé après achat</span></>
                  ) : (
                    <><Lock className="w-3 h-3 text-silver-500" /><span className="text-silver-500">Lecture en ligne uniquement</span></>
                  )}
                </div>
              )}

              <div className="text-center text-silver-500 text-xs space-y-1">
                <p>Accès immédiat · Lecture sécurisée</p>
                <p>Paiement sécurisé par Stripe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-3 space-y-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-gold-600 text-xs uppercase tracking-widest border border-gold-700/40 px-3 py-1 rounded-full">
                {book.category}
              </span>
              {avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <span className="text-silver-500 text-xs">({reviews.length} avis)</span>
                </div>
              )}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-silver-200 font-light leading-tight mb-3">
              {book.title}
            </h1>
            <p className="text-silver-500 text-lg font-serif italic">par {book.author}</p>
          </div>

          <div className="divider-gold" style={{ margin: 0, width: '4rem' }} />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: 'Pages', value: `${book.page_count} pages` },
              { icon: Globe, label: 'Langue', value: book.language === 'fr' ? 'Français' : book.language },
              { icon: Calendar, label: 'Publié le', value: formatDate(book.created_at) },
              { icon: Clock, label: 'Lecture', value: book.estimated_reading_minutes ? `~${book.estimated_reading_minutes} min` : 'N/A' },
            ].map(m => (
              <div key={m.label} className="card-dark p-3 rounded-xl text-center">
                <m.icon className="w-4 h-4 text-gold-600 mx-auto mb-1.5" />
                <p className="text-silver-500 text-[10px] uppercase tracking-wide">{m.label}</p>
                <p className="text-silver-300 text-xs font-medium mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Short description */}
          <div className="py-6 text-center">
            <p className="text-gold-300 font-serif text-xl md:text-2xl italic leading-relaxed">
              "{book.short_description}"
            </p>
          </div>

          {/* Full description */}
          <div>
            <h2 className="font-serif text-xl text-gold-300 mb-4">Description</h2>
            <div className="text-silver-400 text-sm leading-relaxed space-y-3">
              {(book.description || '').split('\n').filter(Boolean).map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Tags */}
          {book.tags?.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-gold-300 mb-4">Thèmes</h2>
              <div className="flex flex-wrap gap-2">
                {book.tags.map((tag: string) => (
                  <span key={tag} className="text-silver-500 text-xs border border-ash px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="font-serif text-xl text-gold-300 mb-4">
              Avis {reviews.length > 0 && <span className="text-silver-500 text-base">({reviews.length})</span>}
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="card-dark rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-silver-300 text-sm font-medium">
                          {review.profile?.full_name || 'Lecteur anonyme'}
                        </p>
                        <p className="text-silver-500 text-xs">{formatDate(review.created_at)}</p>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && <p className="text-silver-400 text-sm leading-relaxed">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-silver-500 text-sm">Aucun avis pour l'instant.</p>
            )}

            {userId && (owned || canReadViaSubscription) && (
              <div className="mt-6">
                <ReviewForm bookId={book.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <div className="mt-16">
          <div className="divider-gold mb-8" />
          <h2 className="font-serif text-2xl text-silver-200 mb-6">Dans la même catégorie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {relatedBooks.map(rb => (
              <BookCard key={rb.id} book={rb} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
