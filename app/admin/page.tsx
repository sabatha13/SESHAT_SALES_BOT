export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import ExecutiveDashboard, { type ExecutiveData } from './ExecutiveDashboard';

export default async function AdminDashboard() {
  const supabase = createServerClient();

  const [purchasesRes, profilesRes, booksRes, sessionsRes, eventsRes] = await Promise.all([
    supabase
      .from('purchases')
      .select('id, user_id, book_id, amount, status, recovery_email_count, created_at'),
    supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('is_admin', false),
    supabase
      .from('books')
      .select('id, title, author, cover_url, is_published'),
    supabase
      .from('reader_sessions')
      .select('book_id, user_id'),
    supabase
      .from('purchase_events')
      .select('id, event_type, purchase_id, user_id, created_at, new_status')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const purchases: any[] = purchasesRes.data ?? [];
  const profiles:  any[] = profilesRes.data  ?? [];
  const books:     any[] = booksRes.data     ?? [];
  const sessions:  any[] = sessionsRes.data  ?? [];
  const events:    any[] = eventsRes.data    ?? [];

  // ── Date boundaries (UTC) ──────────────────────────────────────────
  const now      = new Date();
  const msDay    = 86400000;
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(todayUTC.getTime() + msDay);
  const yesterday= new Date(todayUTC.getTime() - msDay);
  const w7start  = new Date(todayUTC.getTime() - 6 * msDay);
  const wPrev7   = new Date(w7start.getTime() - 7 * msDay);
  const m0       = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const mPrev0   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const y0       = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const yPrev0   = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
  const d30      = new Date(now.getTime() - 30 * msDay);
  const d60      = new Date(now.getTime() - 60 * msDay);

  // ── Helpers ────────────────────────────────────────────────────────
  function inRange(p: any, from: Date, to: Date) {
    const d = new Date(p.created_at);
    return d >= from && d < to;
  }
  function revenueIn(ps: any[], from: Date, to: Date) {
    return ps.filter(p => inRange(p, from, to)).reduce((s, p) => s + (p.amount ?? 0), 0);
  }
  function countIn(ps: any[], from: Date, to: Date) {
    return ps.filter(p => inRange(p, from, to)).length;
  }

  // ── Segments ───────────────────────────────────────────────────────
  const completed    = purchases.filter(p => p.status === 'completed' || p.status === 'external');
  const pending      = purchases.filter(p => p.status === 'pending');
  const refunded     = purchases.filter(p => p.status === 'refunded');
  const withRecovery = purchases.filter(p => (p.recovery_email_count ?? 0) > 0);
  const recovered    = withRecovery.filter(p => p.status === 'completed' || p.status === 'external');

  // ── KPIs : Revenus ─────────────────────────────────────────────────
  const revenueToday     = revenueIn(completed, todayUTC, tomorrow);
  const revenueTodayPrev = revenueIn(completed, yesterday, todayUTC);
  const revenueWeek      = revenueIn(completed, w7start,  tomorrow);
  const revenueWeekPrev  = revenueIn(completed, wPrev7,   w7start);
  const revenueMonth     = revenueIn(completed, m0,       now);
  const revenueMonthPrev = revenueIn(completed, mPrev0,   m0);
  const revenueYear      = revenueIn(completed, y0,       now);
  const revenueYearPrev  = revenueIn(completed, yPrev0,   y0);

  // ── KPIs : Ventes ──────────────────────────────────────────────────
  const ordersToday     = countIn(completed, todayUTC, tomorrow);
  const ordersTodayPrev = countIn(completed, yesterday, todayUTC);

  const completedMonth     = completed.filter(p => inRange(p, m0, now));
  const completedMonthPrev = completed.filter(p => inRange(p, mPrev0, m0));
  const avgOrderValue      = completedMonth.length > 0
    ? Math.round(revenueMonth / completedMonth.length) : 0;
  const avgOrderValuePrev  = completedMonthPrev.length > 0
    ? Math.round(revenueMonthPrev / completedMonthPrev.length) : 0;

  const withRecovMonth  = withRecovery.filter(p => inRange(p, m0, now));
  const recoveredMonth  = withRecovMonth.filter(p => p.status === 'completed' || p.status === 'external');
  const recoveryRate    = withRecovMonth.length > 0 ? Math.round(recoveredMonth.length / withRecovMonth.length * 100) : 0;
  const withRecovPrev   = withRecovery.filter(p => inRange(p, mPrev0, m0));
  const recoveredPrev   = withRecovPrev.filter(p => p.status === 'completed' || p.status === 'external');
  const recoveryRatePrev= withRecovPrev.length > 0 ? Math.round(recoveredPrev.length / withRecovPrev.length * 100) : 0;

  const finMonth        = completedMonth.length + refunded.filter(p => inRange(p, m0, now)).length;
  const refMonth        = refunded.filter(p => inRange(p, m0, now)).length;
  const refundRateMonth = finMonth > 0 ? Math.round(refMonth / finMonth * 100) : 0;
  const finPrev         = completedMonthPrev.length + refunded.filter(p => inRange(p, mPrev0, m0)).length;
  const refPrev         = refunded.filter(p => inRange(p, mPrev0, m0)).length;
  const refundRatePrev  = finPrev > 0 ? Math.round(refPrev / finPrev * 100) : 0;

  // ── KPIs : Clients ─────────────────────────────────────────────────
  const totalCustomers    = profiles.length;
  const newCustomers30d   = profiles.filter(p => new Date(p.created_at) >= d30).length;
  const newCustomersPrev  = profiles.filter(p => {
    const d = new Date(p.created_at);
    return d >= d60 && d < d30;
  }).length;

  const activeUserIds30   = new Set(completed.filter(p => new Date(p.created_at) >= d30).map(p => p.user_id));
  const activeUserIdsPrev = new Set(completed.filter(p => {
    const d = new Date(p.created_at);
    return d >= d60 && d < d30;
  }).map(p => p.user_id));

  const ltvByUser: Record<string, number> = {};
  const booksCountByUser: Record<string, Set<string>> = {};
  completed.forEach(p => {
    ltvByUser[p.user_id] = (ltvByUser[p.user_id] ?? 0) + (p.amount ?? 0);
    if (!booksCountByUser[p.user_id]) booksCountByUser[p.user_id] = new Set();
    booksCountByUser[p.user_id].add(p.book_id);
  });
  const vipCustomers = profiles.filter(p =>
    (ltvByUser[p.id] ?? 0) >= 20000 || (booksCountByUser[p.id]?.size ?? 0) >= 3
  ).length;

  // ── Chart data ─────────────────────────────────────────────────────
  const dailyChart = Array.from({ length: 90 }, (_, i) => {
    const from = new Date(todayUTC.getTime() - (89 - i) * msDay);
    const to   = new Date(from.getTime() + msDay);
    return {
      date:    from.toISOString().slice(0, 10),
      revenue: revenueIn(completed, from, to) / 100,
      orders:  countIn(completed, from, to),
    };
  });

  const monthlyChart = Array.from({ length: 12 }, (_, i) => {
    const mStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
    const mEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 10 + i, 1));
    return {
      date:    mStart.toISOString().slice(0, 7),
      revenue: revenueIn(completed, mStart, mEnd) / 100,
      orders:  countIn(completed, mStart, mEnd),
    };
  });

  // ── Lookup indexes ─────────────────────────────────────────────────
  const purchasesById: Record<string, any> = {};
  purchases.forEach(p => { purchasesById[p.id] = p; });
  const profilesById: Record<string, any> = {};
  profiles.forEach(p => { profilesById[p.id] = p; });
  const booksById: Record<string, any> = {};
  books.forEach(b => { booksById[b.id] = b; });

  // ── Top 10 Livres ──────────────────────────────────────────────────
  const bookStat: Record<string, { revenue: number; sales: number; pending: number; refunded: number; recentSales: number; prevRecentSales: number }> = {};
  purchases.forEach(p => {
    if (!bookStat[p.book_id]) bookStat[p.book_id] = { revenue: 0, sales: 0, pending: 0, refunded: 0, recentSales: 0, prevRecentSales: 0 };
    const bs = bookStat[p.book_id];
    const d  = new Date(p.created_at);
    if (p.status === 'completed' || p.status === 'external') {
      bs.revenue += p.amount ?? 0;
      bs.sales++;
      if (d >= d30) bs.recentSales++;
      if (d >= d60 && d < d30) bs.prevRecentSales++;
    }
    if (p.status === 'pending')  bs.pending++;
    if (p.status === 'refunded') bs.refunded++;
  });

  const sessionsByBook: Record<string, number> = {};
  sessions.forEach(s => { sessionsByBook[s.book_id] = (sessionsByBook[s.book_id] ?? 0) + 1; });

  const totalRevenue = completed.reduce((s, p) => s + (p.amount ?? 0), 0);

  const topBooks = books
    .map(b => {
      const bs    = bookStat[b.id] ?? { revenue: 0, sales: 0, pending: 0, refunded: 0, recentSales: 0, prevRecentSales: 0 };
      const total = bs.sales + bs.pending + bs.refunded;
      const conv  = total > 0 ? Math.round(bs.sales / total * 100) : 0;
      const trend: 'up' | 'flat' | 'down' =
        bs.recentSales > bs.prevRecentSales ? 'up' :
        bs.recentSales < bs.prevRecentSales ? 'down' : 'flat';
      return {
        id: b.id, title: b.title, author: b.author ?? '',
        cover_url: b.cover_url ?? null,
        revenue: bs.revenue, sales: bs.sales,
        readers: sessionsByBook[b.id] ?? 0,
        conversionRate: conv, trend,
        contributionPct: totalRevenue > 0 ? Math.round(bs.revenue / totalRevenue * 100) : 0,
      };
    })
    .filter(b => b.sales > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ── Livres à surveiller ────────────────────────────────────────────
  const attentionBooks = books
    .filter(b => b.is_published)
    .map(b => {
      const bs    = bookStat[b.id] ?? { revenue: 0, sales: 0, pending: 0, refunded: 0, recentSales: 0, prevRecentSales: 0 };
      const total = bs.sales + bs.pending + bs.refunded;
      let severity: 'critical' | 'warning' | 'healthy' = 'healthy';
      let reason = '';
      if (bs.sales === 0) {
        severity = 'critical'; reason = 'Aucune vente depuis la publication';
      } else if (total > 0 && bs.refunded / total > 0.15) {
        severity = 'critical'; reason = `Taux de remboursement : ${Math.round(bs.refunded / total * 100)}%`;
      } else if (total > 0 && bs.pending / total > 0.5) {
        severity = 'warning'; reason = `${Math.round(bs.pending / total * 100)}% des commandes en attente`;
      } else if (bs.recentSales === 0) {
        severity = 'warning'; reason = 'Aucune vente ces 30 derniers jours';
      }
      return { id: b.id, title: b.title, severity, reason };
    })
    .filter(b => b.severity !== 'healthy')
    .sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1))
    .slice(0, 8);

  // ── Customer Highlights ────────────────────────────────────────────
  const customerStats = profiles.map(p => {
    const up   = purchases.filter(pur => pur.user_id === p.id);
    const comp = up.filter(pur => pur.status === 'completed' || pur.status === 'external');
    const ltv  = comp.reduce((s: number, pur: any) => s + (pur.amount ?? 0), 0);
    const wr   = up.filter(pur => (pur.recovery_email_count ?? 0) > 0);
    const wasRecovered = wr.some(pur => pur.status === 'completed' || pur.status === 'external');
    return { user_id: p.id, name: p.full_name ?? '—', email: p.email ?? '—', created_at: p.created_at, ltv, orders: comp.length, wasRecovered };
  });

  const byLtv    = [...customerStats].sort((a, b) => b.ltv    - a.ltv);
  const byOrders = [...customerStats].sort((a, b) => b.orders - a.orders);
  const byNewest = [...customerStats].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recC     = customerStats.filter(c => c.wasRecovered).sort((a, b) => b.ltv - a.ltv);

  const highlights = {
    topCustomer:    byLtv[0]    ? { user_id: byLtv[0].user_id,    name: byLtv[0].name,    email: byLtv[0].email,    ltv: byLtv[0].ltv }    : null,
    newestCustomer: byNewest[0] ? { user_id: byNewest[0].user_id, name: byNewest[0].name, email: byNewest[0].email, created_at: byNewest[0].created_at } : null,
    mostActive:     byOrders[0] ? { user_id: byOrders[0].user_id, name: byOrders[0].name, email: byOrders[0].email, orders: byOrders[0].orders } : null,
    recovered:      recC[0]     ? { user_id: recC[0].user_id,     name: recC[0].name,     email: recC[0].email,     ltv: recC[0].ltv }     : null,
  };

  // ── Bilan financier ────────────────────────────────────────────────
  const grossRevenue   = completed.reduce((s, p) => s + (p.amount ?? 0), 0);
  const refundsTotal   = refunded.reduce((s, p) => s + (p.amount ?? 0), 0);
  const netRevenue     = grossRevenue - refundsTotal;
  const allAov         = completed.length > 0 ? Math.round(grossRevenue / completed.length) : 0;
  const avgCustomerLtv = profiles.length > 0 ? Math.round(grossRevenue / profiles.length) : 0;

  // ── Marketing ─────────────────────────────────────────────────────
  const recoveryEmailsSent  = purchases.reduce((s, p) => s + (p.recovery_email_count ?? 0), 0);
  const recoverySuccessRate = withRecovery.length > 0 ? Math.round(recovered.length / withRecovery.length * 100) : 0;
  const estimatedLostRevenue= pending.reduce((s, p) => s + (p.amount ?? 0), 0);

  // ── Activité ──────────────────────────────────────────────────────
  const activityFeed = events.slice(0, 25).map(ev => {
    const purch = ev.purchase_id ? (purchasesById[ev.purchase_id] ?? null) : null;
    const user  = ev.user_id     ? (profilesById[ev.user_id]     ?? null) : null;
    const book  = purch?.book_id ? (booksById[purch.book_id]     ?? null) : null;
    return {
      id:         ev.id         as string,
      event_type: ev.event_type as string,
      created_at: ev.created_at as string,
      user_name:  (user?.full_name ?? null) as string | null,
      book_title: (book?.title     ?? null) as string | null,
      amount:     (purch?.amount   ?? null) as number | null,
      new_status: (ev.new_status   ?? null) as string | null,
    };
  });

  // ── Analyse exécutive (règles déterministes) ───────────────────────
  const insights: { type: 'positive' | 'warning' | 'neutral'; text: string }[] = [];

  if (revenueMonthPrev > 0) {
    const pct = Math.round((revenueMonth - revenueMonthPrev) / revenueMonthPrev * 100);
    if (pct >= 10)  insights.push({ type: 'positive', text: `Revenus en hausse de ${pct}% ce mois vs le mois précédent.` });
    if (pct <= -10) insights.push({ type: 'warning',  text: `Revenus en baisse de ${Math.abs(pct)}% ce mois vs le mois précédent.` });
  }
  if (topBooks[0] && grossRevenue > 0) {
    const share = Math.round(topBooks[0].revenue / grossRevenue * 100);
    if (share >= 25) insights.push({ type: 'neutral', text: `"${topBooks[0].title}" génère ${share}% du revenu total — concentration à surveiller.` });
  }
  if (recoveryEmailsSent > 0 && recoverySuccessRate >= 15) {
    insights.push({ type: 'positive', text: `Relances efficaces : ${recoverySuccessRate}% des relances se convertissent.` });
  } else if (recoveryEmailsSent > 5 && recoverySuccessRate < 5) {
    insights.push({ type: 'warning', text: `Relances peu efficaces : seulement ${recoverySuccessRate}% de conversion.` });
  }
  const booksNoSales30d = books.filter(b => b.is_published && (bookStat[b.id]?.recentSales ?? 0) === 0).length;
  if (booksNoSales30d > 0) {
    insights.push({ type: 'warning', text: `${booksNoSales30d} livre${booksNoSales30d > 1 ? 's' : ''} publié${booksNoSales30d > 1 ? 's' : ''} sans vente ces 30 derniers jours.` });
  }
  if (pending.length > 5) {
    insights.push({ type: 'warning', text: `${pending.length} commandes en attente — relancer les acheteurs concernés.` });
  }
  if (vipCustomers > 0 && totalCustomers > 0) {
    insights.push({ type: 'positive', text: `${vipCustomers} client${vipCustomers > 1 ? 's' : ''} VIP représentent ${Math.round(vipCustomers / totalCustomers * 100)}% de la base.` });
  }
  if (activeUserIds30.size > 0 && totalCustomers > 0) {
    const rate = Math.round(activeUserIds30.size / totalCustomers * 100);
    if (rate >= 20) insights.push({ type: 'positive', text: `${rate}% des clients ont acheté ces 30 derniers jours — engagement fort.` });
  }
  if (insights.length === 0) {
    insights.push({ type: 'neutral', text: 'Pas encore assez de données pour générer des insights automatiques.' });
  }

  // ── Alertes ────────────────────────────────────────────────────────
  const alerts: { severity: 'critical' | 'warning' | 'healthy'; title: string; message: string }[] = [];

  if (ordersToday === 0 && now.getUTCHours() >= 12) {
    alerts.push({ severity: 'critical', title: "Aucune vente aujourd'hui", message: 'Zéro transaction complétée depuis minuit UTC.' });
  }
  if (refundRateMonth >= 15) {
    alerts.push({ severity: 'critical', title: 'Taux de remboursement élevé', message: `${refundRateMonth}% des ventes ce mois ont été remboursées (seuil : 15%).` });
  }
  if (pending.length >= 10) {
    alerts.push({ severity: 'warning', title: `${pending.length} commandes en attente`, message: 'Volume inhabituel — vérifier les paiements Stripe.' });
  }
  if (revenueMonthPrev > 0 && revenueMonth < revenueMonthPrev * 0.75) {
    alerts.push({ severity: 'warning', title: 'Revenus en baisse significative', message: 'Revenus ce mois inférieurs de plus de 25% au mois précédent.' });
  }
  if (alerts.length === 0) {
    alerts.push({ severity: 'healthy', title: 'Tous les indicateurs sont normaux', message: 'Aucune anomalie détectée.' });
  }

  const execData: ExecutiveData = {
    kpis: {
      revenueToday,     revenueTodayPrev,
      revenueWeek,      revenueWeekPrev,
      revenueMonth,     revenueMonthPrev,
      revenueYear,      revenueYearPrev,
      ordersToday,      ordersTodayPrev,
      avgOrderValue,    avgOrderValuePrev,
      recoveryRate,     recoveryRatePrev,
      refundRate: refundRateMonth, refundRatePrev,
      totalCustomers,
      newCustomers30d,  newCustomersPrev,
      activeCustomers30d: activeUserIds30.size, activeCustomersPrev: activeUserIdsPrev.size,
      vipCustomers,
    },
    dailyChart,
    monthlyChart,
    topBooks,
    attentionBooks,
    highlights,
    financial: { grossRevenue, refundsTotal, netRevenue, avgOrderValue: allAov, avgCustomerLtv },
    marketing: {
      recoveryEmailsSent,
      recoveredOrders:     recovered.length,
      recoverySuccessRate,
      pendingOrders:       pending.length,
      estimatedLostRevenue,
    },
    activityFeed,
    insights,
    alerts,
  };

  return <ExecutiveDashboard data={execData} />;
}
