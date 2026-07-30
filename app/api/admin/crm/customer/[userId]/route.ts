export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

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
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await getAuth();
    if (!clerkUserId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    try { await assertAdmin(clerkUserId); } catch { return NextResponse.json({ error: 'Accès refusé' }, { status: 403 }); }

    const supabase = createServerClient();
    const { userId } = params;

    const [profileRes, purchasesRes, eventsRes, sessionsRes, booksRes] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, clerk_user_id, created_at').eq('id', userId).single(),
      supabase.from('purchases').select('id, book_id, amount, status, created_at, recovery_email_count, stripe_payment_intent, books(title, category)').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('purchase_events').select('id, event_type, event_source, purchase_id, created_at, metadata, new_status, previous_status').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('reader_sessions').select('book_id, completed, last_read_at').eq('user_id', userId),
      supabase.from('books').select('id, title, author').eq('is_published', true).order('title'),
    ]);

    if (!profileRes.data) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

    const profile   = profileRes.data;
    const purchases: any[] = purchasesRes.data ?? [];
    const events: any[]    = eventsRes.data ?? [];
    const sessions: any[]  = sessionsRes.data ?? [];
    const books: any[]     = booksRes.data ?? [];

    // ── Segments ──────────────────────────────────────────────────
    const completed  = purchases.filter(p => p.status === 'completed' || p.status === 'external');
    const refunded   = purchases.filter(p => p.status === 'refunded');
    const pending    = purchases.filter(p => p.status === 'pending');

    const now   = new Date();
    const msDay = 86400000;

    // ── KPIs ──────────────────────────────────────────────────────
    const booksOwned         = new Set(completed.map((p: any) => p.book_id)).size;
    const lifetimeValue      = completed.reduce((s: number, p: any) => s + (p.amount ?? 0), 0); // cents
    const recoveryEmailsSent = purchases.reduce((s: number, p: any) => s + (p.recovery_email_count ?? 0), 0);
    const downloads          = sessions.length;
    const allEvents          = [...events, ...purchases.map((p: any) => ({ created_at: p.created_at }))];
    const lastActivityAt     = allEvents.length > 0
      ? allEvents.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    // ── Purchase list for UI ──────────────────────────────────────
    const purchaseList = purchases.map((p: any) => ({
      id:                    p.id,
      book_id:               p.book_id,
      book_title:            (p.books as any)?.title ?? '—',
      book_category:         (p.books as any)?.category ?? '—',
      amount:                p.amount ?? 0,
      status:                p.status,
      created_at:            p.created_at,
      recovery_email_count:  p.recovery_email_count ?? 0,
      stripe_payment_intent: p.stripe_payment_intent ?? null,
    }));

    // ── Communications (recovery email events) ───────────────────
    const communications = events
      .filter((e: any) => e.event_type === 'recovery_email_sent' || e.event_type === 'newsletter_sent')
      .map((e: any) => ({
        id:          e.id,
        event_type:  e.event_type,
        created_at:  e.created_at,
        purchase_id: e.purchase_id,
        metadata:    e.metadata,
      }));

    // ── Analytics ─────────────────────────────────────────────────
    const revenue       = lifetimeValue;
    const avgOrderValue = completed.length > 0 ? Math.round(lifetimeValue / completed.length) : 0;

    // Purchase frequency: avg days between completed purchases
    let purchaseFrequencyDays: number | null = null;
    if (completed.length >= 2) {
      const sorted = [...completed].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const totalMs = new Date(sorted[sorted.length - 1].created_at).getTime() - new Date(sorted[0].created_at).getTime();
      purchaseFrequencyDays = Math.round(totalMs / msDay / (completed.length - 1));
    }

    // Favorite category
    const catCounts: Record<string, number> = {};
    completed.forEach((p: any) => {
      const cat = (p.books as any)?.category;
      if (cat) catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    });
    const favoriteCategory = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])[0] ?? null;

    // Recovery success rate
    const withRecovery        = purchases.filter((p: any) => (p.recovery_email_count ?? 0) > 0);
    const recoveredAndDone    = withRecovery.filter((p: any) => p.status === 'completed' || p.status === 'external');
    const recoverySuccessRate = withRecovery.length > 0 ? Math.round((recoveredAndDone.length / withRecovery.length) * 100) : 0;

    // ── Health Score (0-100) ──────────────────────────────────────
    // Recent activity (30 pts)
    const recentIn30 = completed.some((p: any) => (now.getTime() - new Date(p.created_at).getTime()) / msDay <= 30);
    const recentIn90 = completed.some((p: any) => (now.getTime() - new Date(p.created_at).getTime()) / msDay <= 90);
    const activityPts = recentIn30 ? 30 : recentIn90 ? 15 : 0;

    // Refund penalty (20 pts)
    const totalFinalized = completed.length + refunded.length;
    const refundRate     = totalFinalized > 0 ? refunded.length / totalFinalized : 0;
    const refundPts      = Math.round((1 - refundRate) * 20);

    // Downloads (20 pts)
    const downloadPts = sessions.length > 0 ? 20 : 0;

    // Pending penalty (15 pts)
    const pendingPts = Math.max(15 - pending.length * 3, 0);

    // Recovery success (15 pts)
    const wasRecovered   = withRecovery.length > 0 && recoveredAndDone.length > 0;
    const hadNoRecovery  = withRecovery.length === 0;
    const recoveryPts    = wasRecovered ? 15 : hadNoRecovery ? 7 : 0;

    const healthValue = Math.min(activityPts + refundPts + downloadPts + pendingPts + recoveryPts, 100);
    const healthLabel =
      healthValue >= 80 ? 'Excellent' :
      healthValue >= 60 ? 'Healthy' :
      healthValue >= 40 ? 'Needs Attention' : 'At Risk';

    // ── Smart Insights ────────────────────────────────────────────
    const insights: { type: 'positive' | 'warning' | 'neutral'; text: string }[] = [];

    if (recentIn30) {
      insights.push({ type: 'positive', text: 'Acheteur actif — achat dans les 30 derniers jours.' });
    }
    if (pending.length >= 3) {
      insights.push({ type: 'warning', text: `${pending.length} commandes en attente de paiement.` });
    }
    if (wasRecovered) {
      insights.push({ type: 'positive', text: 'Client récupéré après email de relance.' });
    }
    if (lifetimeValue >= 50000) {
      insights.push({ type: 'positive', text: `Client haute valeur — LTV : ${formatPrice(lifetimeValue)}.` });
    }
    const daysSinceLast = lastActivityAt ? (now.getTime() - new Date(lastActivityAt).getTime()) / msDay : null;
    if (daysSinceLast !== null && daysSinceLast > 90 && completed.length > 0) {
      insights.push({ type: 'warning', text: `Inactif depuis ${Math.round(daysSinceLast)} jours.` });
    }
    if (completed.length === 0 && pending.length > 0) {
      insights.push({ type: 'warning', text: `N'a jamais finalisé d'achat — ${pending.length} commande(s) en attente.` });
    }
    if (sessions.length > 0) {
      insights.push({ type: 'positive', text: 'Lecteur actif — contenu téléchargé et consulté.' });
    }
    if (refunded.length > 0) {
      insights.push({ type: 'warning', text: `${refunded.length} remboursement(s) dans l'historique.` });
    }
    if (purchaseFrequencyDays !== null && purchaseFrequencyDays <= 30) {
      insights.push({ type: 'positive', text: `Acheteur régulier — fréquence moyenne : ${purchaseFrequencyDays} jours.` });
    }
    if (insights.length === 0) {
      insights.push({ type: 'neutral', text: 'Pas encore assez de données pour générer des insights.' });
    }

    // ── Quick action helpers ──────────────────────────────────────
    const pendingPurchaseId    = pending.length > 0 ? pending[0].id : null;
    const latestCompletedPurchId = completed.length > 0
      ? [...completed].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].id
      : null;

    return NextResponse.json({
      profile: { id: profile.id, email: profile.email, full_name: profile.full_name, created_at: profile.created_at },
      kpis: {
        booksOwned,
        lifetimeValue,
        completedPurchases: completed.length,
        pendingPurchases:   pending.length,
        recoveryEmailsSent,
        downloads,
        refunds:            refunded.length,
        lastActivityAt,
      },
      purchases: purchaseList,
      timeline: events.slice(0, 50),
      communications,
      analytics: {
        revenue,
        avgOrderValue,
        purchaseFrequencyDays,
        recoverySuccessRate,
        favoriteCategory,
        lastActivityAt,
      },
      healthScore: { value: healthValue, label: healthLabel },
      insights,
      books: books.map((b: any) => ({ id: b.id, title: b.title, author: b.author })),
      pendingPurchaseId,
      latestCompletedPurchId,
    });
  } catch (err: any) {
    console.error('[crm-customer]', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
