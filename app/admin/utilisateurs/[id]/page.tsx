import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { clerkClient } from '@clerk/nextjs/server';
import { formatDate, formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ShieldCheck, Ban, Star, Download, Clock, Heart } from 'lucide-react';
import GrantActions from './GrantActions';

export const dynamic = 'force-dynamic';

function getOnlineStatus(lastSeenAt: string | null): { label: string; color: string } {
  if (!lastSeenAt) return { label: 'Hors ligne', color: 'bg-gray-500' };
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = diff / 60000;
  if (minutes < 5) return { label: 'En ligne', color: 'bg-green-500' };
  if (minutes < 30) return { label: 'Récemment actif', color: 'bg-yellow-500' };
  return { label: 'Hors ligne', color: 'bg-gray-500' };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? 'text-gold-400 fill-gold-400' : 'text-silver-600'}`}
        />
      ))}
    </span>
  );
}

function SubscriptionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    canceled: 'bg-red-500/20 text-red-300 border-red-500/30',
    past_due: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  };
  const cls = map[status] ?? 'bg-silver-700/20 text-silver-400 border-silver-600/30';
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full ${cls}`}>{status}</span>
  );
}

function formatDatetime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return '—';
  return formatDatetime(new Date(ts).toISOString());
}

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: user } = await supabase.from('profiles').select('*').eq('id', params.id).single();
  if (!user) notFound();

  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, created_at, book:books(id, title, cover_url, price, category)')
    .eq('user_id', params.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const { data: externalPayments } = await supabase
    .from('purchases')
    .select('id, created_at, amount, payment_method')
    .eq('user_id', params.id)
    .eq('status', 'external')
    .order('created_at', { ascending: false });

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_end')
    .eq('user_id', params.id)
    .eq('status', 'active')
    .single();

  const { data: allBooks } = await supabase.from('books').select('id, title').eq('is_published', true).order('title');

  // Activity data
  const { data: wishlist } = await supabase
    .from('wishlist')
    .select('id, created_at, book:books(id, title, cover_url, category)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, created_at, rating, comment, is_approved, book:books(id, title)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });

  const { data: readerSessions } = await supabase
    .from('reader_sessions')
    .select('id, current_page, total_pages, last_read_at, completed, book:books(id, title, cover_url)')
    .eq('user_id', params.id)
    .order('last_read_at', { ascending: false });

  const { data: downloads } = await supabase
    .from('downloads')
    .select('id, created_at, book:books(id, title)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });

  const { data: subscriptionHistory } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_start, current_period_end, created_at, stripe_subscription_id')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });

  // Clerk data
  let clerkLastSignIn: number | null = null;
  let clerkCreatedAt: number | null = null;
  if (user.clerk_user_id) {
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(user.clerk_user_id);
      clerkLastSignIn = clerkUser.lastSignInAt ?? null;
      clerkCreatedAt = clerkUser.createdAt ?? null;
    } catch {
      // silent
    }
  }

  const ownedBookIds = (purchases || []).map((p: any) => p.book?.id).filter(Boolean);
  const availableBooks = (allBooks || []).filter((b: any) => !ownedBookIds.includes(b.id));
  const ownedBooks = (purchases || []).map((p: any) => ({
    purchaseId: p.id,
    bookId: p.book?.id,
    title: p.book?.title,
    cover_url: p.book?.cover_url,
    category: p.book?.category,
    purchaseDate: p.created_at,
    price: p.book?.price || 0,
  }));

  const onlineStatus = getOnlineStatus(user.last_seen_at ?? null);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/utilisateurs" className="text-silver-500 hover:text-gold-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-silver-200">{user.full_name || 'Utilisateur'}</h1>
          <p className="text-silver-500 text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {user.is_banned && (
            <span className="flex items-center gap-1 text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded-full">
              <Ban className="w-3 h-3" /> Suspendu
            </span>
          )}
          {user.is_admin && (
            <span className="flex items-center gap-1 text-gold-400 text-xs border border-gold-500/30 px-2 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          )}
        </div>
      </div>

      {/* Status & Connection */}
      <div className="card-dark p-5 rounded-xl">
        <h2 className="font-serif text-xl text-gold-300 mb-4">Statut &amp; Connexion</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${onlineStatus.color} flex-shrink-0`} />
            <div>
              <p className="text-silver-200 text-sm font-medium">{onlineStatus.label}</p>
              <p className="text-silver-500 text-xs">Statut de présence</p>
            </div>
          </div>
          <div>
            <p className="text-silver-400 text-xs uppercase tracking-wide mb-0.5">Dernière activité</p>
            <p className="text-silver-200 text-sm">{formatDatetime(user.last_seen_at)}</p>
          </div>
          <div>
            <p className="text-silver-400 text-xs uppercase tracking-wide mb-0.5">Dernière connexion Clerk</p>
            <p className="text-silver-200 text-sm">{formatTimestamp(clerkLastSignIn)}</p>
          </div>
          <div>
            <p className="text-silver-400 text-xs uppercase tracking-wide mb-0.5">Compte créé le</p>
            <p className="text-silver-200 text-sm">{formatDatetime(user.created_at)}</p>
          </div>
          {user.clerk_user_id && (
            <div className="sm:col-span-2">
              <p className="text-silver-400 text-xs uppercase tracking-wide mb-0.5">ID Clerk</p>
              <p className="text-silver-500 text-xs font-mono">{user.clerk_user_id}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-dark p-4 rounded-xl text-center">
          <p className="text-2xl font-serif gold-text">{purchases?.length || 0}</p>
          <p className="text-silver-500 text-xs mt-1">Livres achetés</p>
        </div>
        <div className="card-dark p-4 rounded-xl text-center">
          <p className="text-2xl font-serif gold-text">{formatPrice(
            (purchases || []).reduce((sum: number, p: any) => sum + (p.book?.price || 0), 0) +
            (externalPayments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
          )}</p>
          <p className="text-silver-500 text-xs mt-1">Total reçu</p>
        </div>
        <div className={`card-dark p-4 rounded-xl text-center ${subscription && Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000) <= 7 ? 'border border-yellow-500/30' : ''}`}>
          {subscription ? (() => {
            const daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000);
            return (
              <>
                <p className="text-sm font-serif text-purple-400">Abonné</p>
                <p className="text-silver-500 text-xs mt-1">Jusqu&apos;au {formatDate(subscription.current_period_end)}</p>
                {daysLeft <= 7 && daysLeft > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">⚠ {daysLeft}j restant{daysLeft > 1 ? 's' : ''}</p>
                )}
                {daysLeft <= 0 && (
                  <p className="text-red-400 text-xs mt-1">Expiré</p>
                )}
              </>
            );
          })() : (
            <>
              <p className="text-lg font-serif gold-text">{formatDate(user.created_at)}</p>
              <p className="text-silver-500 text-xs mt-1">Inscrit le</p>
            </>
          )}
        </div>
      </div>

      <GrantActions userId={user.id} books={availableBooks} ownedBooks={ownedBooks} hasSubscription={!!subscription} isBanned={!!user.is_banned} />

      <div>
        <h2 className="font-serif text-xl text-gold-300 mb-4">Livres possédés ({purchases?.length || 0})</h2>
        {purchases && purchases.length > 0 ? (
          <div className="space-y-3">
            {purchases.map((p: any) => (
              <div key={p.id} className="card-dark p-4 rounded-xl flex items-center gap-4">
                {p.book?.cover_url ? (
                  <img src={p.book.cover_url} alt={p.book.title} className="w-12 h-16 object-cover rounded-lg border border-ash/50" />
                ) : (
                  <div className="w-12 h-16 bg-charcoal rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gold-700/50" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-silver-200 text-sm font-medium">{p.book?.title}</p>
                  <p className="text-silver-500 text-xs">{p.book?.category}</p>
                  <p className="text-silver-500 text-xs mt-1">Acheté le {formatDate(p.created_at)}</p>
                </div>
                <p className="text-gold-400 text-sm font-semibold">{formatPrice(p.book?.price || 0)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-dark p-8 rounded-xl text-center">
            <BookOpen className="w-10 h-10 text-silver-600 mx-auto mb-3" />
            <p className="text-silver-500 text-sm">Aucun achat pour le moment.</p>
          </div>
        )}
      </div>

      {/* External payments */}
      {(externalPayments || []).length > 0 && (
        <div>
          <h2 className="font-serif text-xl text-gold-300 mb-4">Paiements externes ({externalPayments!.length})</h2>
          <div className="space-y-2">
            {externalPayments!.map((p: any) => (
              <div key={p.id} className="card-dark p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-silver-300 text-sm font-medium">Abonnement</p>
                  <p className="text-silver-500 text-xs mt-0.5">{p.payment_method} · {formatDate(p.created_at)}</p>
                </div>
                <p className="text-emerald-400 text-sm font-semibold">{formatPrice(p.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist */}
      <div>
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-gold-400" />
          Wishlist ({wishlist?.length || 0})
        </h2>
        {wishlist && wishlist.length > 0 ? (
          <div className="space-y-3">
            {wishlist.map((w: any) => (
              <div key={w.id} className="card-dark p-4 rounded-xl flex items-center gap-4">
                {w.book?.cover_url ? (
                  <img src={w.book.cover_url} alt={w.book.title} className="w-10 h-14 object-cover rounded border border-ash/50" />
                ) : (
                  <div className="w-10 h-14 bg-charcoal rounded flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-silver-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-silver-200 text-sm font-medium">{w.book?.title}</p>
                  <p className="text-silver-500 text-xs">{w.book?.category}</p>
                </div>
                <p className="text-silver-500 text-xs">Ajouté le {formatDate(w.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-dark p-6 rounded-xl text-center">
            <p className="text-silver-500 text-sm">Wishlist vide</p>
          </div>
        )}
      </div>

      {/* Reading progress */}
      <div>
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold-400" />
          Progression de lecture ({readerSessions?.length || 0})
        </h2>
        {readerSessions && readerSessions.length > 0 ? (
          <div className="space-y-3">
            {readerSessions.map((s: any) => {
              const pct = s.total_pages && s.total_pages > 0 ? Math.round((s.current_page / s.total_pages) * 100) : 0;
              return (
                <div key={s.id} className="card-dark p-4 rounded-xl flex items-center gap-4">
                  {s.book?.cover_url ? (
                    <img src={s.book.cover_url} alt={s.book.title} className="w-10 h-14 object-cover rounded border border-ash/50 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 bg-charcoal rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-silver-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-silver-200 text-sm font-medium truncate">{s.book?.title}</p>
                      {s.completed && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">Terminé ✓</span>
                      )}
                    </div>
                    <p className="text-silver-500 text-xs mb-2">Page {s.current_page} / {s.total_pages} ({pct}%)</p>
                    <div className="w-full bg-charcoal rounded-full h-1.5">
                      <div className="bg-gold-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className="text-silver-500 text-xs whitespace-nowrap">{s.last_read_at ? formatDate(s.last_read_at) : '—'}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-dark p-6 rounded-xl text-center">
            <p className="text-silver-500 text-sm">Aucune session de lecture.</p>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div>
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-gold-400" />
          Avis laissés ({reviews?.length || 0})
        </h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="card-dark p-4 rounded-xl">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-silver-200 text-sm font-medium">{r.book?.title}</p>
                    <p className="text-silver-500 text-xs">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StarRating rating={r.rating} />
                    {r.is_approved ? (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">Approuvé</span>
                    ) : (
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full">En attente</span>
                    )}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-silver-400 text-sm line-clamp-3">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card-dark p-6 rounded-xl text-center">
            <p className="text-silver-500 text-sm">Aucun avis laissé.</p>
          </div>
        )}
      </div>

      {/* Downloads */}
      <div>
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-gold-400" />
          Téléchargements ({downloads?.length || 0})
        </h2>
        {downloads && downloads.length > 0 ? (
          <div className="space-y-2">
            {downloads.map((d: any) => (
              <div key={d.id} className="card-dark p-4 rounded-xl flex items-center justify-between">
                <p className="text-silver-200 text-sm">{d.book?.title}</p>
                <p className="text-silver-500 text-xs">{formatDate(d.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-dark p-6 rounded-xl text-center">
            <p className="text-silver-500 text-sm">Aucun téléchargement.</p>
          </div>
        )}
      </div>

      {/* Subscription history */}
      <div>
        <h2 className="font-serif text-xl text-gold-300 mb-4">Historique abonnements ({subscriptionHistory?.length || 0})</h2>
        {subscriptionHistory && subscriptionHistory.length > 0 ? (
          <div className="space-y-3">
            {subscriptionHistory.map((s: any) => (
              <div key={s.id} className="card-dark p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SubscriptionStatusBadge status={s.status} />
                    {s.stripe_subscription_id && (
                      <span className="text-silver-600 text-xs font-mono">{s.stripe_subscription_id}</span>
                    )}
                  </div>
                  <p className="text-silver-500 text-xs">
                    {s.current_period_start ? formatDate(s.current_period_start) : '—'}
                    {' → '}
                    {s.current_period_end ? formatDate(s.current_period_end) : '—'}
                  </p>
                </div>
                <p className="text-silver-500 text-xs whitespace-nowrap">Créé le {formatDate(s.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-dark p-6 rounded-xl text-center">
            <p className="text-silver-500 text-sm">Aucun abonnement dans l&apos;historique.</p>
          </div>
        )}
      </div>
    </div>
  );
}
