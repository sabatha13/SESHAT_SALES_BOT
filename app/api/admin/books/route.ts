export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

async function assertAdmin(clerkUserId: string) {
  const supabase = createServerClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', clerkUserId).single();
  if (!data?.is_admin) throw new Error('Accès refusé');
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await assertAdmin(userId);

    const supabase = createServerClient();
    const fd = await req.formData();

    const title = fd.get('title') as string;
    const author = fd.get('author') as string;
    const description = fd.get('description') as string;
    const short_description = fd.get('short_description') as string;
    const price = Math.round(parseFloat(fd.get('price') as string) * 100);
    const category = fd.get('category') as string;
    const tags = (fd.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);
    const page_count = parseInt(fd.get('page_count') as string) || 0;
    const language = fd.get('language') as string;
    const is_featured = fd.get('is_featured') === 'true';
    const is_published = fd.get('is_published') === 'true';
    const pdfFile = fd.get('pdf') as File | null;
    const coverFile = fd.get('cover') as File | null;

    if (!pdfFile) return NextResponse.json({ error: 'PDF requis' }, { status: 400 });

    // Upload PDF to private bucket
    const pdfName = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '_')}`;
    const { error: pdfErr } = await supabase.storage
      .from('pdfs')
      .upload(pdfName, pdfFile, { contentType: 'application/pdf', upsert: false });
    if (pdfErr) throw new Error(`PDF upload: ${pdfErr.message}`);

    let cover_url = '';
    if (coverFile && coverFile.size > 0) {
      const coverName = `${Date.now()}-${coverFile.name.replace(/\s+/g, '_')}`;
      const { data: coverData, error: coverErr } = await supabase.storage
        .from('covers')
        .upload(coverName, coverFile, { contentType: coverFile.type, upsert: false });
      if (coverErr) throw new Error(`Cover upload: ${coverErr.message}`);
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(coverName);
      cover_url = publicUrl;
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        title, author, description, short_description,
        price, category, tags, page_count, language,
        is_featured, is_published, cover_url, pdf_path: pdfName,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ book: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
