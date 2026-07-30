export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import MarketingCenter from './MarketingCenter';
import type { MarketingData, CampaignType, CampaignStatus } from './MarketingCenter';

export default async function MarketingPage() {
  const supabase = createServerClient();

  const [
    profilesRes,
    purchasesRes,
    booksRes,
    couponsRes,
    sessionsRes,
    eventsRes,
    promotionsRes,
    campaignsRes,
    runsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, created_at').eq('is_admin', false),
    supabase.from('purchases').select('id, user_id, book_id, amount, status, recovery_email_count, first_recovery_email_sent_at, created_at'),
    supabase.from('books').select('id, title, author, price, cover_url, is_published, created_at'),
    supabase.from('coupons').select('id, code, discount_percent, discount_cents, max_uses, uses_count, expires_at, is_active, created_at'),
    supabase.from('reader_sessions').select('user_id, book_id'),
    supabase.from('purchase_events').select('id, event_type, user_id, book_id, purchase_id, amount, metadata, created_at').order('created_at', { ascending: false }).limit(300),
    supabase.from('promotions').select('*').limit(50),
    supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('marketing_campaign_runs').select('*').order('started_at', { ascending: false }).limit(500),
  ]);

  const profiles    = profilesRes.data    ?? [];
  const purchases   = purchasesRes.data   ?? [];
  const books       = booksRes.data       ?? [];
  const coupons     = couponsRes.data     ?? [];
  const sessions    = sessionsRes.data    ?? [];
  const events      = eventsRes.data      ?? [];
  const promos      = promotionsRes.data  ?? [];
  const dbCampaigns = campaignsRes.data   ?? [];
  const dbRuns      = runsRes.data        ?? [];

  const now   = new Date();
  const msDay = 86_400_000;

  // ── Base segments ──────────────────────────────────────────────
  const completed = purchases.filter(p => p.status === 'completed' || p.status === 'external');
  const pending   = purchases.filter(p => p.status === 'pending');
  const totalRevenue = completed.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

  // Recovery
  const recoveryEmailsSent  = purchases.reduce((s: number, p: any) => s + (p.recovery_email_count ?? 0), 0);
  const recoveredPurchases  = completed.filter((p: any) => (p.recovery_email_count ?? 0) > 0);
  const recoveredRevenue    = recoveredPurchases.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const recoveryConvRate    = recoveryEmailsSent > 0 ? Math.round(recoveredPurchases.length / recoveryEmailsSent * 100) : 0;

  // Newsletter events
  const newsletterEvents    = events.filter((e: any) => e.event_type === 'newsletter_sent');
  const totalEmailsSent     = recoveryEmailsSent + newsletterEvents.length;

  // Coupons/promos still queried for future features (coupon validation, promo banners)

  // Month comparison for revenue trend
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const revThisMonth   = completed.filter((p: any) => new Date(p.created_at) >= thisMonthStart).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const revLastMonth   = completed.filter((p: any) => new Date(p.created_at) >= lastMonthStart && new Date(p.created_at) < thisMonthStart).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const revenueTrend   = revLastMonth > 0 ? Math.round((revThisMonth - revLastMonth) / revLastMonth * 100) : 0;

  // ── Audience segments ──────────────────────────────────────────
  const sessionsByUser: Record<string, number>   = {};
  sessions.forEach((s: any) => { sessionsByUser[s.user_id] = (sessionsByUser[s.user_id] ?? 0) + 1; });

  const purchasesByUser: Record<string, any[]>   = {};
  purchases.forEach((p: any) => {
    if (!purchasesByUser[p.user_id]) purchasesByUser[p.user_id] = [];
    purchasesByUser[p.user_id].push(p);
  });

  const avgLtv = profiles.length > 0 ? totalRevenue / profiles.length : 0;

  function userCompleted(userId: string) {
    return (purchasesByUser[userId] ?? []).filter((x: any) => x.status === 'completed' || x.status === 'external');
  }
  function userLtv(userId: string) {
    return userCompleted(userId).reduce((s: number, x: any) => s + (x.amount ?? 0), 0);
  }
  function userLastPurchase(userId: string): number {
    const comp = userCompleted(userId);
    if (!comp.length) return 0;
    return Math.max(...comp.map((x: any) => new Date(x.created_at).getTime()));
  }

  const audienceSegments = [
    { key: 'all',            label: 'Tous les clients',        count: profiles.length,                                                                         estimatedRevenue: totalRevenue,                                     lastUpdated: now.toISOString() },
    { key: 'vip',            label: 'Clients VIP',             count: profiles.filter((p: any) => userLtv(p.id) >= 20000 || new Set(userCompleted(p.id).map((x: any) => x.book_id)).size >= 3).length, estimatedRevenue: Math.round(totalRevenue * 0.4), lastUpdated: now.toISOString() },
    { key: 'high_ltv',       label: 'LTV élevé (> $100)',      count: profiles.filter((p: any) => userLtv(p.id) >= 10000).length,                              estimatedRevenue: Math.round(totalRevenue * 0.6),                   lastUpdated: now.toISOString() },
    { key: 'new',            label: 'Nouveaux clients (30j)',  count: profiles.filter((p: any) => (now.getTime() - new Date(p.created_at).getTime()) / msDay <= 30).length, estimatedRevenue: 0,                           lastUpdated: now.toISOString() },
    { key: 'inactive_30',    label: 'Inactifs 30 jours',       count: profiles.filter((p: any) => { const l = userLastPurchase(p.id); return l === 0 || (now.getTime() - l) / msDay > 30; }).length, estimatedRevenue: Math.round(totalRevenue * 0.15), lastUpdated: now.toISOString() },
    { key: 'inactive_90',    label: 'Inactifs 90 jours',       count: profiles.filter((p: any) => { const l = userLastPurchase(p.id); return l === 0 || (now.getTime() - l) / msDay > 90; }).length, estimatedRevenue: Math.round(totalRevenue * 0.08), lastUpdated: now.toISOString() },
    { key: 'pending',        label: 'Achats en attente',       count: new Set(pending.map((p: any) => p.user_id)).size,                                        estimatedRevenue: pending.reduce((s: number, p: any) => s + (p.amount ?? 0), 0), lastUpdated: now.toISOString() },
    { key: 'recovered',      label: 'Clients récupérés',       count: new Set(recoveredPurchases.map((p: any) => p.user_id)).size,                             estimatedRevenue: recoveredRevenue,                                 lastUpdated: now.toISOString() },
    { key: 'once',           label: 'Achat unique',            count: profiles.filter((p: any) => userCompleted(p.id).length === 1).length,                    estimatedRevenue: 0,                                                lastUpdated: now.toISOString() },
    { key: 'multi',          label: 'Plusieurs livres',        count: profiles.filter((p: any) => userCompleted(p.id).length >= 2).length,                     estimatedRevenue: 0,                                                lastUpdated: now.toISOString() },
    { key: 'never',          label: "Jamais acheté",           count: profiles.filter((p: any) => userCompleted(p.id).length === 0).length,                    estimatedRevenue: 0,                                                lastUpdated: now.toISOString() },
    { key: 'downloaded',     label: 'A téléchargé',            count: Object.keys(sessionsByUser).length,                                                      estimatedRevenue: 0,                                                lastUpdated: now.toISOString() },
    { key: 'never_dl',       label: "N'a jamais téléchargé",  count: profiles.filter((p: any) => !sessionsByUser[p.id]).length,                               estimatedRevenue: 0,                                                lastUpdated: now.toISOString() },
  ];

  // ── Campaigns (from marketing_campaigns + marketing_campaign_runs) ─
  const AUDIENCE_LABEL: Record<string, string> = {
    all:         'Tous les clients',
    vip:         'Clients VIP',
    high_ltv:    'LTV élevé (> $100)',
    new:         'Nouveaux clients (30j)',
    inactive_30: 'Inactifs 30 jours',
    inactive_90: 'Inactifs 90 jours',
    pending:     'Achats en attente',
    recovered:   'Clients récupérés',
    once:        'Achat unique',
    multi:       'Plusieurs livres',
    never:       'Jamais acheté',
    downloaded:  'A téléchargé',
    never_dl:    "N'a jamais téléchargé",
  };

  const campaigns = dbCampaigns.map((c: any) => {
    const runs       = dbRuns.filter((r: any) => r.campaign_id === c.id);
    const latestRun  = runs[0]; // already ordered DESC by started_at
    const runRevenue = runs.reduce((s: number, r: any) => s + (r.revenue_cents ?? 0), 0);
    const runConvs   = runs.reduce((s: number, r: any) => s + (r.conversions   ?? 0), 0);
    const runSent    = runs.reduce((s: number, r: any) => s + (r.emails_sent   ?? 0), 0);
    const openRate   = latestRun && latestRun.emails_sent > 0
      ? Math.round(latestRun.emails_opened / latestRun.emails_sent * 100)
      : null;

    // Recovery campaign: bootstrap from purchase data until first real run is created
    let revenue    = runRevenue;
    let convRate   = runSent > 0 ? Math.round(runConvs / runSent * 100) : 0;
    let recipients = latestRun?.audience_size ?? 0;
    if (c.type === 'recovery' && runs.length === 0) {
      revenue    = recoveredRevenue;
      convRate   = recoveryConvRate;
      recipients = new Set(pending.map((p: any) => p.user_id)).size;
    }

    return {
      id:             c.id             as string,
      name:           c.name           as string,
      type:           c.type           as CampaignType,
      status:         c.status         as CampaignStatus,
      audience:       AUDIENCE_LABEL[c.audience_key as string] ?? c.audience_key ?? 'Tous les clients',
      recipients,
      revenue,
      openRate,
      conversionRate: convRate,
      roi:            revenue > 0 ? revenue : null as number | null,
      createdAt:      c.created_at     as string,
      runsCount:      runs.length,
      lastRunAt:      (latestRun?.started_at ?? null) as string | null,
    };
  });

  const totalCampaigns = campaigns.filter(c => c.status === 'running').length;
  const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length;
  const draftCount     = campaigns.filter(c => c.status === 'draft').length;

  // ── Recommendations (deterministic signals) ────────────────────
  const recommendations: MarketingData['recommendations'] = [];

  // Books with no sale in 45+ days
  const lastSaleByBook: Record<string, number> = {};
  completed.forEach((p: any) => {
    const t = new Date(p.created_at).getTime();
    if (!lastSaleByBook[p.book_id] || t > lastSaleByBook[p.book_id]) lastSaleByBook[p.book_id] = t;
  });
  const staleBooks = books.filter((b: any) => b.is_published && (!lastSaleByBook[b.id] || (now.getTime() - lastSaleByBook[b.id]) / msDay > 45));
  if (staleBooks.length > 0) {
    recommendations.push({
      id: 'promo-stale', title: 'Promotion weekend', type: 'promotion', priority: 'medium',
      reason: `${staleBooks.length} livre${staleBooks.length > 1 ? 's' : ''} sans vente depuis 45+ jours`,
      expectedAudience: audienceSegments.find(s => s.key === 'inactive_30')!.count,
      estimatedRevenue: Math.round(totalRevenue * 0.05),
    });
  }

  // High pending
  if (pending.length >= 3) {
    recommendations.push({
      id: 'recovery-push', title: 'Campagne de récupération', type: 'recovery', priority: 'high',
      reason: `${pending.length} achat${pending.length > 1 ? 's' : ''} en attente à récupérer`,
      expectedAudience: new Set(pending.map((p: any) => p.user_id)).size,
      estimatedRevenue: Math.round(pending.reduce((s: number, p: any) => s + (p.amount ?? 0), 0) * 0.25),
    });
  }

  // VIP inactive 60+ days
  const vipInactiveCount = profiles.filter((p: any) => {
    const ltv   = userLtv(p.id);
    const owned = new Set(userCompleted(p.id).map((x: any) => x.book_id)).size;
    if (ltv < 20000 && owned < 3) return false;
    const last  = userLastPurchase(p.id);
    return last === 0 || (now.getTime() - last) / msDay > 60;
  }).length;
  if (vipInactiveCount > 0) {
    recommendations.push({
      id: 'vip-exclusive', title: 'Exclusivité VIP', type: 'newsletter', priority: 'high',
      reason: `${vipInactiveCount} client${vipInactiveCount > 1 ? 's' : ''} VIP inactif${vipInactiveCount > 1 ? 's' : ''} depuis 60+ jours`,
      expectedAudience: vipInactiveCount,
      estimatedRevenue: Math.round(vipInactiveCount * avgLtv * 0.3),
    });
  }

  // New books this month
  const newBooks = books.filter((b: any) => b.is_published && (now.getTime() - new Date(b.created_at).getTime()) / msDay <= 30);
  if (newBooks.length > 0) {
    recommendations.push({
      id: 'launch', title: 'Lancement nouveau titre', type: 'newsletter', priority: 'medium',
      reason: `${newBooks.length} nouveau${newBooks.length > 1 ? 'x' : ''} titre${newBooks.length > 1 ? 's' : ''} ce mois`,
      expectedAudience: profiles.length,
      estimatedRevenue: Math.round(newBooks.length * (totalRevenue / Math.max(books.length, 1)) * 0.3),
    });
  }

  // Never purchased
  const neverCount = audienceSegments.find(s => s.key === 'never')!.count;
  if (neverCount > 5) {
    recommendations.push({
      id: 'onboarding', title: 'Premier achat (-15%)', type: 'coupon', priority: 'low',
      reason: `${neverCount} inscrit${neverCount > 1 ? 's' : ''} n'ont jamais acheté`,
      expectedAudience: neverCount,
      estimatedRevenue: Math.round(neverCount * avgLtv * 0.1),
    });
  }

  // ── Activity Feed ──────────────────────────────────────────────
  const activityFeed = events
    .filter((e: any) => ['newsletter_sent', 'recovery_email_sent', 'payment_completed', 'checkout_created', 'coupon_applied'].includes(e.event_type))
    .slice(0, 40)
    .map((e: any) => {
      const book = books.find((b: any) => b.id === e.book_id);
      let description = '';
      switch (e.event_type) {
        case 'newsletter_sent':      description = `Newsletter envoyée — ${book?.title ?? 'Catalogue complet'}`; break;
        case 'recovery_email_sent':  description = `Email de relance envoyé`; break;
        case 'payment_completed':    description = `Paiement converti — ${book?.title ?? '—'}`; break;
        case 'checkout_created':     description = `Nouveau panier créé`; break;
        case 'coupon_applied':       description = `Coupon appliqué`; break;
        default:                     description = e.event_type;
      }
      return { id: e.id as string, type: e.event_type as string, description, timestamp: e.created_at as string };
    });

  // ── Analytics (last 30 days) ────────────────────────────────────
  const analyticsDaily = Array.from({ length: 30 }, (_, i) => {
    const d      = new Date(now.getTime() - (29 - i) * msDay);
    const ds     = d.toISOString().slice(0, 10);
    const rev    = completed.filter((p: any) => (p.created_at as string)?.slice(0, 10) === ds).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    const emails = events.filter((e: any) => (e.created_at as string)?.slice(0, 10) === ds && (e.event_type === 'newsletter_sent' || e.event_type === 'recovery_email_sent')).length;
    const convs  = recoveredPurchases.filter((p: any) => (p.created_at as string)?.slice(0, 10) === ds).length;
    return { date: ds, revenue: rev, emails, conversions: convs };
  });

  // ── Final data payload ─────────────────────────────────────────
  const data: MarketingData = {
    kpis: {
      campaigns:         totalCampaigns,
      emailsSent:        totalEmailsSent,
      recipients:        profiles.length,
      revenueGenerated:  recoveredRevenue,
      conversionRate:    recoveryConvRate,
      scheduledCampaigns: scheduledCount,
      draftCampaigns:     draftCount,
      revenueTrend,
      emailsTrend:       0,
      campaignsTrend:    0,
    },
    campaigns,
    audienceSegments,
    recommendations,
    activityFeed,
    analytics: { daily: analyticsDaily },
    books: books.map((b: any) => ({ id: b.id as string, title: b.title as string, author: (b.author ?? '') as string })),
    totalCustomers: profiles.length,
    totalRevenue,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Marketing</h1>
        <p className="text-silver-500 text-sm font-serif italic">Centre de croissance commerciale · {totalCampaigns} campagne{totalCampaigns !== 1 ? 's' : ''} active{totalCampaigns !== 1 ? 's' : ''}</p>
      </div>
      <MarketingCenter data={data} />
    </div>
  );
}
