export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import CrmClient from './CrmClient';

export default async function CrmPage() {
  const supabase = createServerClient();

  const [profilesRes, purchasesRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, created_at').eq('is_admin', false),
    supabase.from('purchases').select('id, user_id, book_id, amount, status, recovery_email_count, created_at'),
    supabase.from('reader_sessions').select('user_id, book_id'),
  ]);

  const profiles:  any[] = profilesRes.data  ?? [];
  const purchases: any[] = purchasesRes.data ?? [];
  const sessions:  any[] = sessionsRes.data  ?? [];

  const now   = new Date();
  const msDay = 86400000;

  const customers = profiles.map(profile => {
    const up = purchases.filter((p: any) => p.user_id === profile.id);
    const completed = up.filter((p: any) => p.status === 'completed' || p.status === 'external');
    const pending   = up.filter((p: any) => p.status === 'pending');

    const lifetimeValue  = completed.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    const booksOwned     = new Set(completed.map((p: any) => p.book_id)).size;
    const pendingOrders  = pending.length;
    const recoveryEmails = up.reduce((s: number, p: any) => s + (p.recovery_email_count ?? 0), 0);

    const lastPurchaseAt = completed.length > 0
      ? [...completed].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    const isVip      = lifetimeValue >= 20000 || booksOwned >= 3;
    const isActive   = completed.some((p: any) => (now.getTime() - new Date(p.created_at).getTime()) / msDay <= 90);
    const isRecovered = up.some((p: any) => (p.recovery_email_count ?? 0) > 0 && (p.status === 'completed' || p.status === 'external'));

    let status: 'vip' | 'active' | 'pending' | 'recovered' | 'inactive';
    if (isVip)                                           status = 'vip';
    else if (isActive)                                   status = 'active';
    else if (isRecovered)                                status = 'recovered';
    else if (pendingOrders > 0 && completed.length === 0) status = 'pending';
    else                                                 status = 'inactive';

    return {
      user_id:          profile.id,
      full_name:        profile.full_name ?? '—',
      email:            profile.email ?? '—',
      books_owned:      booksOwned,
      lifetime_value:   lifetimeValue,
      pending_orders:   pendingOrders,
      recovery_emails:  recoveryEmails,
      last_purchase_at: lastPurchaseAt,
      status,
    };
  });

  // VIP first, then by LTV desc
  customers.sort((a, b) => {
    if (a.status === 'vip' && b.status !== 'vip') return -1;
    if (b.status === 'vip' && a.status !== 'vip') return 1;
    return b.lifetime_value - a.lifetime_value;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">CRM</h1>
        <p className="text-silver-500 text-sm font-serif italic">{customers.length} client{customers.length !== 1 ? 's' : ''} enregistré{customers.length !== 1 ? 's' : ''}</p>
      </div>
      <CrmClient customers={customers} />
    </div>
  );
}
