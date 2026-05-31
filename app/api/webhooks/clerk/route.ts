export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 });

  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') || '',
    'svix-timestamp': req.headers.get('svix-timestamp') || '',
    'svix-signature': req.headers.get('svix-signature') || '',
  };

  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerClient();
  const data = event.data;

  if (event.type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address || '';
    const full_name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const avatar_url = data.image_url || null;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', data.id)
      .single();

    if (!existing) {
      await supabase.from('profiles').insert({
        clerk_user_id: data.id,
        email,
        full_name,
        avatar_url,
      });
    }
  }

  if (event.type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address || '';
    const full_name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const avatar_url = data.image_url || null;

    await supabase
      .from('profiles')
      .update({ email, full_name, avatar_url })
      .eq('clerk_user_id', data.id);
  }

  return NextResponse.json({ success: true });
}
