export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

async function getAuth() {
  const { auth } = await import('@clerk/nextjs/server');
  return auth();
}

async function assertAdmin(clerkUserId: string) {
  const supabase = createServerClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', clerkUserId).single();
  if (!data?.is_admin) throw new Error('Accès refusé');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    try { await assertAdmin(userId); } catch { return NextResponse.json({ error: 'Accès refusé' }, { status: 403 }); }

    const supabase = createServerClient();
    const { bookId } = params;

    const [bookRes, purchasesRes, eventsRes, sessionsRes] = await Promise.all([
      supabase.from('books').select('id').eq('id', bookId).single(),
      supabase
        .from('purchases')
        .select('id, user_id, amount, status, created_at, recovery_email_count, profiles(email, full_name)')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_events')
        .select('id, event_type, event_source, purchase_id, created_at, metadata, new_status, previous_status')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('reader_sessions')
        .select('user_id, completed')
        .eq('book_id', bookId),
    ]);

    if (!bookRes.data) return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 });

    const purchases: any[] = purchasesRes.data ?? [];
    const events: any[] = eventsRes.data ?? [];
    const sessions: any[] = sessionsRes.data ?? [];

    // ── Base segments ────────────────────────────────────────────
    const completed = purchases.filter(p => p.status === 'completed' || p.status === 'external');
    const refunded = purchases.filter(p => p.status === 'refunded');
    const pending = purchases.filter(p => p.status === 'pending');

    // ── KPIs — amounts stay in cents for formatPrice() ───────────
    const revenueCents = completed.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    const sales = completed.length;
    const readers = new Set(completed.map((p: any) => p.user_id)).size;
    const refundsCount = refunded.length;
    const pendingCount = pending.length;
    const avgSellingPriceCents = sales > 0 ? Math.round(revenueCents / sales) : 0;
    const lastSaleAt: string | null = completed.length > 0
      ? [...completed].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    const withRecovery = purchases.filter((p: any) => (p.recovery_email_count ?? 0) > 0);
    const recoveredAndCompleted = withRecovery.filter((p: any) => p.status === 'completed' || p.status === 'external');
    const recoveryRate = withRecovery.length > 0
      ? Math.round((recoveredAndCompleted.length / withRecovery.length) * 100)
      : 0;

    // ── Revenue chart — last 30 days, values in dollars ──────────
    const today = new Date();
    const revenueChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const dayRows = completed.filter((p: any) => p.created_at.slice(0, 10) === dateStr);
      return {
        date: dateStr.slice(5), // MM-DD
        revenue: parseFloat((dayRows.reduce((s: number, p: any) => s + (p.amount ?? 0), 0) / 100).toFixed(2)),
        sales: dayRows.length,
      };
    });

    // ── Funnel ───────────────────────────────────────────────────
    const checkoutStartedIds = new Set(
      events.filter((e: any) => e.event_type === 'checkout_created').map((e: any) => e.purchase_id)
    );
    const funnelStart = checkoutStartedIds.size || purchases.length;
    const funnel = {
      checkout_started: funnelStart,
      pending: pendingCount + sales + refundsCount,
      completed: sales,
      refunded: refundsCount,
    };

    // ── Recent buyers ────────────────────────────────────────────
    const recentBuyers = purchases.slice(0, 20).map((p: any) => ({
      user_id: p.user_id,
      email: (p.profiles as any)?.email ?? '—',
      full_name: (p.profiles as any)?.full_name ?? '—',
      amount: p.amount ?? 0, // cents
      status: p.status,
      created_at: p.created_at,
      recovery_email_count: p.recovery_email_count ?? 0,
    }));

    // ── Performance Score ────────────────────────────────────────
    const revenueScore = Math.min(revenueCents / 200000, 1) * 100; // $2000 = full score
    const totalInitiated = purchases.length;
    const conversionScore = totalInitiated > 0 ? (sales / totalInitiated) * 100 : 50;
    const totalFinalized = sales + refundsCount;
    const refundScore = totalFinalized > 0 ? (1 - refundsCount / totalFinalized) * 100 : 100;
    const readerScore = sales > 0 ? Math.min(sessions.length / sales, 1) * 100 : 50;

    const scoreValue = Math.min(Math.round(
      revenueScore * 0.40 +
      conversionScore * 0.25 +
      refundScore * 0.15 +
      readerScore * 0.10 +
      recoveryRate * 0.10
    ), 100);
    const scoreLabel =
      scoreValue >= 80 ? 'Excellent' :
      scoreValue >= 60 ? 'Bon' :
      scoreValue >= 40 ? 'Moyen' : 'À améliorer';

    // ── Smart Insights ───────────────────────────────────────────
    const insights: { type: 'positive' | 'warning' | 'neutral'; text: string }[] = [];
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthRev = completed
      .filter((p: any) => new Date(p.created_at) >= thisMonthStart)
      .reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    const lastMonthRev = completed
      .filter((p: any) => new Date(p.created_at) >= lastMonthStart && new Date(p.created_at) < thisMonthStart)
      .reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

    if (lastMonthRev > 0) {
      const pct = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
      if (pct >= 10) insights.push({ type: 'positive', text: `Revenus en hausse de ${pct} % vs le mois dernier.` });
      else if (pct <= -10) insights.push({ type: 'warning', text: `Revenus en baisse de ${Math.abs(pct)} % vs le mois dernier.` });
    }

    const refundRate = totalFinalized > 0 ? (refundsCount / totalFinalized) * 100 : 0;
    if (refundRate > 10) {
      insights.push({ type: 'warning', text: `Taux de remboursement élevé : ${refundRate.toFixed(1)} %.` });
    } else if (refundRate < 3 && totalFinalized >= 5) {
      insights.push({ type: 'positive', text: `Taux de remboursement excellent : ${refundRate.toFixed(1)} %.` });
    }

    if (recoveryRate > 15) {
      insights.push({ type: 'positive', text: `Les relances convertissent à ${recoveryRate} % — stratégie efficace.` });
    }

    const weekendSales = completed.filter((p: any) => [0, 6].includes(new Date(p.created_at).getDay()));
    const weekdaySales = completed.filter((p: any) => ![0, 6].includes(new Date(p.created_at).getDay()));
    if (weekdaySales.length > 0 && weekendSales.length >= 3) {
      const wkendAvg = weekendSales.length / 2;
      const wkdayAvg = weekdaySales.length / 5;
      if (wkendAvg > wkdayAvg * 1.5) {
        insights.push({ type: 'neutral', text: `Les achats sont plus fréquents le week-end.` });
      }
    }

    const msDay = 86400000;
    const first7 = completed.filter((p: any) => {
      const ago = (now.getTime() - new Date(p.created_at).getTime()) / msDay;
      return ago > 7 && ago <= 14;
    });
    const second7 = completed.filter((p: any) => {
      const ago = (now.getTime() - new Date(p.created_at).getTime()) / msDay;
      return ago <= 7;
    });
    if (first7.length >= 3 && second7.length < first7.length * 0.5) {
      insights.push({ type: 'warning', text: `Les ventes ont ralenti sur les 7 derniers jours.` });
    } else if (first7.length > 0 && second7.length > first7.length * 1.5 && second7.length >= 3) {
      insights.push({ type: 'positive', text: `Accélération des ventes ces 7 derniers jours.` });
    }

    if (pendingCount > 3) {
      insights.push({ type: 'warning', text: `${pendingCount} commandes en attente de paiement.` });
    }

    if (insights.length === 0) {
      insights.push({ type: 'neutral', text: `Pas encore assez de données pour générer des insights.` });
    }

    return NextResponse.json({
      kpis: {
        revenue: revenueCents,
        sales,
        readers,
        recoveryRate,
        pendingOrders: pendingCount,
        refunds: refundsCount,
        avgSellingPrice: avgSellingPriceCents,
        lastSaleAt,
      },
      revenueChart,
      funnel,
      recentBuyers,
      timeline: events.slice(0, 25),
      score: { value: scoreValue, label: scoreLabel },
      insights,
    });
  } catch (err: any) {
    console.error('[book-analytics]', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
