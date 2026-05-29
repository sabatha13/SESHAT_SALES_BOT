import { notFound } from "next/navigation";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import BookCard from "@/components/books/BookCard";
import { Feather } from "lucide-react";

export default async function AuteurPage({ params }) {
  const supabase = createServerClient();
  const { data: author } = await supabase.from("author_profiles").select("*").eq("slug", params.slug).single();
  if (!author) notFound();
  const { data: books } = await supabase.from("books").select("*").eq("author", author.name).eq("is_published", true).order("created_at", { ascending: false });
  return (
    <div className="min-h-screen py-20 px-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-16">
        <div className="shrink-0">
          {author.photo_url ? (
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-gold-600/40">
              <Image src={author.photo_url} alt={author.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-36 h-36 rounded-full bg-charcoal border-2 border-ash flex items-center justify-center">
              <Feather className="w-12 h-12 text-gold-700/40" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <p className="text-gold-600 text-xs uppercase tracking-widest mb-2">Auteur</p>
          <h1 className="font-serif text-4xl md:text-5xl text-silver-100 font-light mb-4">{author.name}</h1>
          <div className="w-12 h-px bg-gold-600/50 mx-auto sm:mx-0" />
        </div>
      </div>
      {author.favorite_quote && (
        <div className="card-dark p-6 rounded-2xl border-l-2 border-gold-600/50 mb-12">
          <p className="font-serif text-xl text-silver-300 italic leading-relaxed">"{author.favorite_quote}"</p>
          <p className="text-gold-600 text-sm mt-3">— {author.name}</p>
        </div>
      )}
      {author.bio && (
        <div className="mb-16">
          <h2 className="font-serif text-2xl text-gold-300 mb-6">Biographie</h2>
          <div className="space-y-4">{author.bio.split("\n").filter(Boolean).map((para, i) => <p key={i} className="text-silver-400 leading-relaxed">{para}</p>)}</div>
        </div>
      )}
      {books && books.length > 0 && (
        <div>
          <div className="divider-gold mb-8" />
          <h2 className="font-serif text-2xl text-silver-200 mb-6">Oeuvres de {author.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">{books.map(book => <BookCard key={book.id} book={book} />)}</div>
        </div>
      )}
    </div>
  );
}