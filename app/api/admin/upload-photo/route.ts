import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_user_id', userId)
      .single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const fd = await req.formData();
    const file = fd.get('file') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `author-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, file, { contentType: file.type, upsert: true });

    if (uploadError) throw new Error(`Upload: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
