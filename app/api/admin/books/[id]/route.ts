import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

async function assertAdmin(clerkUserId: string) {
  const supabase = createServerClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', clerkUserId).single();
  if (!data?.is_admin) throw new Error('Accès refusé');
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await assertAdmin(userId);

    const supabase = createServerClient();
    const fd = await req.formData();

    const updates: Record<string, any> = {
      title: fd.get('title'),
      author: fd.get('author'),
      description: fd.get('description'),
      short_description: fd.get('short_description'),
      price: Math.round(parseFloat(fd.get('price') as string) * 100),
      category: fd.get('category'),
      tags: (fd.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      page_count: parseInt(fd.get('page_count') as string) || 0,
      language: fd.get('language'),
      is_featured: fd.get('is_featured') === 'true',
      is_published: fd.get('is_published') === 'true',
    };

    const pdfFile = fd.get('pdf') as File | null;
    if (pdfFile && pdfFile.size > 0) {
      const pdfName = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '_')}`;
      await supabase.storage.from('pdfs').upload(pdfName, pdfFile, { contentType: 'application/pdf' });
      updates.pdf_path = pdfName;
    }

    const coverFile = fd.get('cover') as File | null;
    if (coverFile && coverFile.size > 0) {
      const coverName = `${Date.now()}-${coverFile.name.replace(/\s+/g, '_')}`;
      await supabase.storage.from('covers').upload(coverName, coverFile, { contentType: coverFile.type });
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(coverName);
      updates.cover_url = publicUrl;
    }

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ book: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await assertAdmin(userId);

    const supabase = createServerClient();
    const { error } = await supabase.from('books').delete().eq('id', params.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
