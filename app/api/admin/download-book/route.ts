import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await assertAdmin(userId);

    const { book_id } = await req.json();
    if (!book_id) return NextResponse.json({ error: 'book_id requis' }, { status: 400 });

    const supabase = createServerClient();

    const { data: book } = await supabase
      .from('books')
      .select('id, pdf_path, title, download_allowed')
      .eq('id', book_id)
      .single();

    if (!book) return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 });
    if (!book.pdf_path) return NextResponse.json({ error: 'Aucun fichier PDF associé à ce livre' }, { status: 404 });

    const { data: signedData } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(book.pdf_path, 900, { download: true });

    if (!signedData?.signedUrl) {
      return NextResponse.json({ error: 'Impossible de générer l\'URL de téléchargement' }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl, title: book.title });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
