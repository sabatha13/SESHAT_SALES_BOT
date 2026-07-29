export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  ArrowLeft, BookOpen, Crown, Heart, Clock, Download,
  CheckCircle, ShieldAlert, User,
} from 'lucide-react';
import AdminDownloadButton from './AdminDownloadButton';

interface Props { params: { id: string } }

export default async function AdminUserVuePage({ params }: Props) {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile) notFound();

  const [
    purchasesRes,
    sessionsRes,
    wishlistRes,
    subRes,
    payHistoryRes,
  ] = await Promise.all([
    supabase
      .from('purchases')
      .select('id, created_at, amount, payment_method, book:books(id, title, author, cover_url, download_allowed, access_type, price)')
      .eq('user_id', params.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),

    supabase
      .from('reader_sessions')
      .select('id, current_page, total_pages, last_read_at, completed, book:books(id, title, cover_url)')
      .eq('user_id', params.id)
      .order('last_read_at', { ascending: false }),

    supabase
      .from('wishlist')
      .select('id, created_at, book:books(id, title, author, cover_url, price)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('user_id', params.id)
      .eq('status', 'active')
      .single(),

    supabase
      .from('purchases')
      .select('id, created_at, amount, payment_method, status, book:books(title)')
      .eq('user_id', params.id)
      .in('status', ['completed', 'external'])
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const purchases = purchasesRes.data || [];
  const sessions = sessionsRes.data || [];
  const wishlist = wishlistRes.data || [];
  const subscription = subRes.data;
  const payHistory = payHistoryRes.data || [];

  const continueReading = sessions.filter((s: any) => !s.completed && (s.current_page || 0) > 1);
  const completedBooks = sessions.filter((s: any) => s.completed);
  const hasSubscription = !!subscription;

  const daysLeft = subscription?.current_period_end
    ? Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/admin/utilisateurs/${params.id}`} className="text-silver-500 hover:text-gold-400 transition-colors mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium uppercase tracking-wide">Vue Admin — lecture seule</span>
          </div>
          <h1 className="font-serif text-2xl text-silver-200">
            Ce que voit <span className="text-gold-300">{profile.full_name || profile.email}</span>
          </h1>
          <p className="text-silver-500 text-sm mt-0.5">{profile.email}</p>
        </div>
      </div>

      {/* Admin banner */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300 text-sm">
          Vous consultez cette page en tant qu&apos;administrateur. Les données affichées sont celles de l&apos;utilisateur.
          Les boutons de téléchargement utilisent vos propres droits admin (non les droits de l&apos;utilisateur).
          Aucune action ici ne modifie l&apos;authentification.
        </p>
      </div>

      {/* ─── PROFIL ─── */}
      <section>
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" /> Profil utilisateur
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Subscription */}
          {hasSubscription ? (
            <div className={`card-dark p-5 rounded-xl ${daysLeft !== null && daysLeft <= 7 ? 'border border-yellow-500/30' : 'border border-purple-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-silver-300 text-sm font-medium">Abonnement actif</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">Actif</span>
              </div>
              {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                <p className="text-yellow-400 text-xs mb-1">⚠ Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</p>
              )}
              <p className="text-silver-500 text-sm">
                Jusqu&apos;au <span className="text-silver-300 font-medium">{formatDate(subscription!.current_period_end)}</span>
              </p>
            </div>
          ) : (
            <div className="card-dark p-5 rounded-xl border border-ash/30">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-silver-600" />
                <span className="text-silver-400 text-sm">Pas d&apos;abonnement actif</span>
              </div>
              <p className="text-silver-500 text-xs">L&apos;utilisateur verra un CTA pour s&apos;abonner.</p>
            </div>
          )}

          {/* Recent payments */}
          <div className="card-dark p-5 rounded-xl border border-ash/30">
            <p className="text-silver-400 text-xs uppercase tracking-wide mb-3">Historique paiements</p>
            {payHistory.length > 0 ? (
              <div className="space-y-2">
                {payHistory.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-silver-300 text-xs">
                        {p.status === 'external' ? 'Abonnement' : (p.book?.title || 'Achat')}
                      </p>
                      <p className="text-silver-600 text-[10px]">
                        {formatDate(p.created_at)}{p.payment_method ? ` · ${p.payment_method}` : ''}
                      </p>
                    </div>
                    <span className="text-gold-400 text-xs font-medium">{formatPrice(p.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-silver-500 text-xs">Aucun paiement enregistré.</p>
            )}
          </div>
        </div>
      </section>

      {/* ─── BIBLIOTHÈQUE ─── */}
      <section>
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Ma Bibliothèque
          <span className="text-silver-500 text-sm font-sans font-normal">(vue /bibliotheque)</span>
        </h2>

        {/* Continue reading */}
        {continueReading.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gold-400" />
              <p className="text-silver-300 text-sm font-medium">Continuer la lecture</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {continueReading.slice(0, 6).map((s: any) => {
                const pct = s.total_pages > 0 ? Math.round((s.current_page / s.total_pages) * 100) : 0;
                return (
                  <div key={s.id} className="card-dark rounded-xl overflow-hidden border border-ash/30">
                    <div className="relative aspect-[2/3] bg-charcoal">
                      {s.book?.cover_url ? (
                        <Image src={s.book.cover_url} alt={s.book.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gold-700/30" />
                        </div>
                      )}
                    </div>
                    {pct > 0 && (
                      <div className="h-1 bg-ash/50">
                        <div className="h-full bg-gold-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-silver-200 text-xs font-medium line-clamp-1">{s.book?.title}</p>
                      <p className="text-gold-600 text-[10px] mt-0.5">{pct}% lu</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Purchased books */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-gold-400" />
            <p className="text-silver-300 text-sm font-medium">Mes Livres Achetés ({purchases.length})</p>
          </div>
          {purchases.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {purchases.map((p: any) => {
                const book = p.book;
                if (!book) return null;
                return (
                  <div key={p.id} className="card-dark rounded-xl overflow-hidden border border-ash/30 flex flex-col">
                    <Link href={`/livre/${book.id}`} target="_blank" rel="noopener" className="block relative aspect-[2/3] bg-charcoal group">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gold-700/30" />
                        </div>
                      )}
                    </Link>
                    <div className="p-2 flex flex-col flex-1">
                      <p className="text-silver-200 text-xs font-medium line-clamp-1 mb-0.5">{book.title}</p>
                      <p className="text-silver-500 text-[10px] mb-2">{book.author}</p>
                      <div className="mt-auto space-y-1">
                        <Link
                          href={`/livre/${book.id}`}
                          target="_blank"
                          rel="noopener"
                          className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] text-gold-400 border border-gold-600/30 hover:bg-gold-600/10 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" /> Voir le livre
                        </Link>
                        {book.download_allowed && (
                          <AdminDownloadButton bookId={book.id} bookTitle={book.title} />
                        )}
                        {!book.download_allowed && (
                          <p className="text-silver-600 text-[10px] text-center py-1">Lecture seule</p>
                        )}
                      </div>
                    </div>
                    {p.amount > 0 && (
                      <div className="px-2 pb-2">
                        <p className="text-gold-600 text-[10px]">
                          {formatPrice(p.amount)}{p.payment_method ? ` · ${p.payment_method}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-dark p-8 rounded-xl text-center border border-ash/30">
              <BookOpen className="w-8 h-8 text-silver-600 mx-auto mb-2" />
              <p className="text-silver-500 text-sm">L&apos;utilisateur verra un CTA vers la boutique.</p>
            </div>
          )}
        </div>

        {/* Wishlist */}
        {wishlist.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-gold-400" />
              <p className="text-silver-300 text-sm font-medium">Mes Favoris ({wishlist.length})</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {wishlist.map((w: any) => {
                const book = w.book;
                if (!book) return null;
                return (
                  <Link key={w.id} href={`/livre/${book.id}`} target="_blank" rel="noopener"
                    className="card-dark rounded-xl overflow-hidden border border-ash/30 hover:border-gold-600/30 transition-all">
                    <div className="relative aspect-[2/3] bg-charcoal">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gold-700/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-silver-200 text-xs font-medium line-clamp-1">{book.title}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedBooks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <p className="text-silver-300 text-sm font-medium">Livres terminés ({completedBooks.length})</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {completedBooks.map((s: any) => (
                <div key={s.id} className="card-dark rounded-xl overflow-hidden border border-emerald-500/20">
                  <div className="relative aspect-[2/3] bg-charcoal">
                    {s.book?.cover_url ? (
                      <Image src={s.book.cover_url} alt={s.book.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gold-700/30" />
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 bg-emerald-500 rounded-full p-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-silver-200 text-xs font-medium line-clamp-1">{s.book?.title}</p>
                    <p className="text-emerald-400 text-[10px]">Terminé</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Downloads section */}
      <section>
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" /> Téléchargements PDF disponibles
        </h2>
        {purchases.filter((p: any) => p.book?.download_allowed).length > 0 ? (
          <div className="space-y-2">
            {purchases
              .filter((p: any) => p.book?.download_allowed)
              .map((p: any) => (
                <div key={p.id} className="card-dark p-4 rounded-xl flex items-center gap-4">
                  {p.book?.cover_url ? (
                    <Image src={p.book.cover_url} alt={p.book.title} width={40} height={56} className="rounded object-cover border border-ash/50 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 bg-charcoal rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-silver-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-silver-200 text-sm font-medium truncate">{p.book?.title}</p>
                    <p className="text-silver-500 text-xs">{p.book?.author}</p>
                    {p.amount > 0 && (
                      <p className="text-gold-600 text-xs mt-0.5">
                        {formatPrice(p.amount)}{p.payment_method ? ` · ${p.payment_method}` : ''}
                      </p>
                    )}
                  </div>
                  <AdminDownloadButton bookId={p.book.id} bookTitle={p.book.title} />
                </div>
              ))}
          </div>
        ) : (
          <div className="card-dark p-6 rounded-xl text-center border border-ash/30">
            <p className="text-silver-500 text-sm">Aucun livre téléchargeable parmi les achats.</p>
          </div>
        )}
      </section>
    </div>
  );
}
