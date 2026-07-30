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

  // Pre-group sessions by user_id for O(1) health score lookup
  const sessionsByUser: Record<string, number> = {};
  sessions.forEach((s: any) => {
    sessionsByUser[s.user_id] = (sessionsByUser[s.user_id] ?? 0) + 1;
  });

  // Date ranges for trend computation
  const thisMonth     = now.getMonth();
  const thisYear      = now.getFullYear();
  const lastMonthIdx  = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const customers = profiles.map(profile => {
    const up        = purchases.filter((p: any) => p.user_id === profile.id);
    const completed = up.filter((p: any) => p.status === 'completed' || p.status === 'external');
    const pending   = up.filter((p: any) => p.status === 'pending');
    const refunded  = up.filter((p: any) => p.status === 'refunded');

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
    if (isVip)                                             status = 'vip';
    else if (isActive)                                     status = 'active';
    else if (isRecovered)                                  status = 'recovered';
    else if (pendingOrders > 0 && completed.length === 0) status = 'pending';
    else                                                   status = 'inactive';

    // Health score (mirrors /api/admin/crm/customer formula)
    const recentIn30  = completed.some((p: any) => (now.getTime() - new Date(p.created_at).getTime()) / msDay <= 30);
    const recentIn90  = completed.some((p: any) => (now.getTime() - new Date(p.created_at).getTime()) / msDay <= 90);
    const activityPts = recentIn30 ? 30 : recentIn90 ? 15 : 0;
    const totalFin    = completed.length + refunded.length;
    const refundRate  = totalFin > 0 ? refunded.length / totalFin : 0;
    const refundPts   = Math.round((1 - refundRate) * 20);
    const downloadPts = (sessionsByUser[profile.id] ?? 0) > 0 ? 20 : 0;
    const pendingPts  = Math.max(15 - pending.length * 3, 0);
    const withRec     = up.filter((p: any) => (p.recovery_email_count ?? 0) > 0);
    const recDone     = withRec.filter((p: any) => p.status === 'completed' || p.status === 'external');
    const recPts      = (withRec.length > 0 && recDone.length > 0) ? 15 : withRec.length === 0 ? 7 : 0;
    const healthValue = Math.min(activityPts + refundPts + downloadPts + pendingPts + recPts, 100);
    const health: 'healthy' | 'needs_attention' | 'at_risk' =
      healthValue >= 60 ? 'healthy' : healthValue >= 40 ? 'needs_attention' : 'at_risk';

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
      health,
    };
  });

  // VIP first, then by LTV desc
  customers.sort((a, b) => {
    if (a.status === 'vip' && b.status !== 'vip') return -1;
    if (b.status === 'vip' && a.status !== 'vip') return  1;
    return b.lifetime_value - a.lifetime_value;
  });

  // Trend metrics for KPI cards
  const newThisMonth   = profiles.filter((p: any) => {
    const d = new Date(p.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const newLastMonth   = profiles.filter((p: any) => {
    const d = new Date(p.created_at);
    return d.getMonth() === lastMonthIdx && d.getFullYear() === lastMonthYear;
  }).length;

  const activeLast30   = customers.filter(c =>
    c.last_purchase_at && (now.getTime() - new Date(c.last_purchase_at).getTime()) / msDay <= 30
  ).length;

  const activePrev30   = customers.filter(c => {
    if (!c.last_purchase_at) return false;
    const d = (now.getTime() - new Date(c.last_purchase_at).getTime()) / msDay;
    return d > 30 && d <= 60;
  }).length;

  const pendingThisWeek = purchases.filter((p: any) =>
    p.status === 'pending' && (now.getTime() - new Date(p.created_at).getTime()) / msDay <= 7
  ).length;

  const pendingLastWeek = purchases.filter((p: any) => {
    if (p.status !== 'pending') return false;
    const d = (now.getTime() - new Date(p.created_at).getTime()) / msDay;
    return d > 7 && d <= 14;
  }).length;

  const meta = {
    newThisMonth,
    newLastMonth,
    activeLast30,
    activePrev30,
    pendingThisWeek,
    pendingLastWeek,
    vipCount: customers.filter(c => c.status === 'vip').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">CRM</h1>
        <p className="text-silver-500 text-sm font-serif italic">{customers.length} client{customers.length !== 1 ? 's' : ''} enregistré{customers.length !== 1 ? 's' : ''}</p>
      </div>
      <CrmClient customers={customers} meta={meta} />
    </div>
  );
}
