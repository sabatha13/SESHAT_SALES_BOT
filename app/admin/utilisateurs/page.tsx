export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, Ban } from 'lucide-react';
import Link from 'next/link';
import UtilisateursClient from './UtilisateursClient';

async function getUsers() {
  const supabase = createServerClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('*, purchases(id, created_at)')
    .order('created_at', { ascending: false });

  if (!users) return [];

  const userIds = users.map((u: any) => u.id);

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .in('user_id', userIds)
    .eq('status', 'active');

  const { data: sessions } = await supabase
    .from('reader_sessions')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  const activeSubIds = new Set((subs || []).map((s: any) => s.user_id));

  return users.map((u: any) => {
    const lastSession = (sessions || []).find((s: any) => s.user_id === u.id);
    const lastPurchase = (u.purchases || []).sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    const lastActivity = lastSession?.created_at || lastPurchase?.created_at || null;

    return {
      ...u,
      purchase_count: u.purchases?.length || 0,
      is_subscribed: activeSubIds.has(u.id),
      last_activity: lastActivity,
    };
  });
}

export default async function UtilisateursPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Utilisateurs</h1>
        <p className="text-silver-500 text-sm">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
      </div>
      <UtilisateursClient users={users} />
    </div>
  );
}
