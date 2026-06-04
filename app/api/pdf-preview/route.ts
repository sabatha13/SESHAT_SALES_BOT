export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { PDFDocument } from 'pdf-lib';

// Public preview: returns only the first pages of a book's PDF.
// The full document never reaches the client, so this is safe to expose freely.
export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) return new NextResponse('Missing bookId', { status: 400 });

  const supabase = createServerClient();

  const { data: book } = await supabase
    .from('books')
    .select('pdf_path')
    .eq('id', bookId)
    .eq('is_published', true)
    .single();

  if (!book?.pdf_path) return new NextResponse('Not found', { status: 404 });

  const { data: signed } = await supabase.storage.from('pdfs').createSignedUrl(book.pdf_path, 300);
  if (!signed?.signedUrl) return new NextResponse('PDF not found', { status: 404 });

  const pdfRes = await fetch(signed.signedUrl);
  if (!pdfRes.ok) return new NextResponse('PDF fetch failed', { status: 502 });

  try {
    const srcBytes = await pdfRes.arrayBuffer();
    const srcDoc = await PDFDocument.load(srcBytes);
    const total = srcDoc.getPageCount();

    // Show ~12% of the book, between 5 and 15 pages, never the whole book.
    const previewCount = Math.min(15, Math.max(5, Math.ceil(total * 0.12)), Math.max(1, total - 1));

    const outDoc = await PDFDocument.create();
    const indices = Array.from({ length: previewCount }, (_, i) => i);
    const pages = await outDoc.copyPages(srcDoc, indices);
    pages.forEach(p => outDoc.addPage(p));

    const outBytes = await outDoc.save();

    return new NextResponse(Buffer.from(outBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'X-Preview-Pages': String(previewCount),
        'X-Total-Pages': String(total),
      },
    });
  } catch {
    return new NextResponse('Preview generation failed', { status: 500 });
  }
}
