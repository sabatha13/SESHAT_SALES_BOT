import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { formatDate, formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';
import GrantActions from './GrantActions';

export const dynamic = 'force-dynamic';

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: user } = await supabase.from('profiles').select('*').eq('id', params.id).single();
  if (!user) notFound();

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, book:books(id, title, cover_url, price, category)')
    .eq('user_id', params.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const { data: allBooks } = await supabase
    .from('books')
    .select('id, title')
    .eq('is_published', true)
    .order('title');

  const ownedBookIds = (purchases || []).map((p: any) => p.book?.id).filter(Boolean);
  const availableBooks = (allBooks || []).filter((b: any) => !ownedBookIds.includes(b.id));

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
        {user.is_admin && (
          <span className="flex items-center gap-1 text-gold-400 text-xs border border-gold-500/30 px-2 py-1 rounded-full ml-auto">
            <ShieldCheck className="w-3 h-3" /> Admin
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-dark p-4 rounded-xl text-center">
          <p className="text-2xl font-serif gold-text">{purchases?.length || 0}</p>
          <p className="text-silver-500 text-xs mt-1">Livres achetés</p>
        </div>
        <div className="card-dark p-4 rounded-xl text-center">
          <p className="text-2xl font-serif gold-text">{formatPrice((purchases || []).reduce((sum: number, p: any) => sum + (p.book?.price || 0), 0))}</p>
          <p className="text-silver-500 text-xs mt-1">Total dépensé</p>
        </div>
        <div className="card-dark p-4 rounded-xl text-center">
          <p className="text-lg font-serif gold-text">{formatDate(user.created_at)}</p>
          <p className="text-silver-500 text-xs mt-1">Inscrit le</p>
        </div>
      </div>

      <GrantActions userId={user.id} books={availableBooks} />

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
    </div>
  );
}