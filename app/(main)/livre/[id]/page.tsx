import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import PurchaseButton from '@/components/books/PurchaseButton';
import { formatPrice, formatDate } from '@/lib/utils';
import { BookOpen, Calendar, FileText, Globe, Tag } from 'lucide-react';

interface Props {
  params: { id: string };
}

async function getBook(id: string) {
  const supabase = createServerClient();
  const { data } = await supabase.from('books').select('*').eq('id', id).eq('is_published', true).single();
  return data;
}

async function checkOwnership(clerkUserId: string, bookId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', clerkUserId).single();
  if (!profile) return false;
  const { data } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', profile.id)
    .eq('book_id', bookId)
    .eq('status', 'completed')
    .single();
  return !!data;
}

export default async function LivrePage({ params }: Props) {
  const book = await getBook(params.id);
  if (!book) notFound();

  const { userId } = await auth();
  const owned = userId ? await checkOwnership(userId, book.id) : false;

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
            </div>

            {/* Purchase CTA */}
            <div className="card-dark p-5 rounded-2xl mt-5 space-y-4">
              <div className="text-center">
                <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">Prix</p>
                <p className="text-3xl font-serif gold-text">{formatPrice(book.price)}</p>
              </div>
              <PurchaseButton bookId={book.id} price={book.price} owned={owned} />
              {owned && (
                <p className="text-center text-emerald-400 text-xs">✓ Vous possédez ce livre</p>
              )}
              <div className="text-center text-silver-500 text-xs space-y-1 pt-2 border-t border-ash/50">
                <p>Accès immédiat · Lecture sécurisée</p>
                <p>Paiement sécurisé par Stripe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-3 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gold-600 text-xs uppercase tracking-widest border border-gold-700/40 px-3 py-1 rounded-full">
                {book.category}
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-silver-200 font-light leading-tight mb-3">
              {book.title}
            </h1>
            <p className="text-silver-500 text-lg font-serif italic">par {book.author}</p>
          </div>

          <div className="divider-gold" style={{ marginLeft: 0, width: '4rem', margin: 0 }} />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: 'Pages', value: `${book.page_count} pages` },
              { icon: Globe, label: 'Langue', value: book.language === 'fr' ? 'Français' : book.language },
              { icon: Calendar, label: 'Publié le', value: formatDate(book.created_at) },
              { icon: Tag, label: 'Format', value: 'PDF numérique' },
            ].map(m => (
              <div key={m.label} className="card-dark p-3 rounded-xl text-center">
                <m.icon className="w-4 h-4 text-gold-600 mx-auto mb-1.5" />
                <p className="text-silver-500 text-[10px] uppercase tracking-wide">{m.label}</p>
                <p className="text-silver-300 text-xs font-medium mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Short description */}
          <div className="card-dark p-5 rounded-2xl border-l-2 border-gold-600/50">
            <p className="text-silver-300 font-serif text-lg italic leading-relaxed">
              "{book.short_description}"
            </p>
          </div>

          {/* Full description */}
          <div>
            <h2 className="font-serif text-xl text-gold-300 mb-4">Description</h2>
            <div className="prose-dark text-silver-400 text-sm leading-relaxed space-y-3">
              {book.description.split('\n').filter(Boolean).map((para, i) => (
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
        </div>
      </div>
    </div>
  );
}
