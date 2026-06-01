import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import BookForm from '@/components/admin/BookForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: { id: string };
}

export default async function EditLivrePage({ params }: Props) {
  const supabase = createServerClient();
  const { data: book } = await supabase.from('books').select('id,title,author,short_description,description,price,category,tags,page_count,language,is_featured,is_published,download_allowed,subscription_included,access_type,estimated_reading_minutes,pdf_path,cover_url').eq('id', params.id).single();
  if (!book) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Modifier le livre</h1>
        <p className="text-silver-500 text-sm font-serif italic">{book.title}</p>
      </div>
      <BookForm book={book} />
    </div>
  );
}
