export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import AutomationCenter from './AutomationCenter';
import type { AutomationData, AutomationStatus, Condition } from './AutomationCenter';

export default async function AutomationPage() {
  const supabase = createServerClient();

  const [automationsRes, runsRes, campaignsRes, campaignRunsRes] = await Promise.all([
    supabase
      .from('marketing_automations')
      .select('*, marketing_campaigns(id, name, type)')
      .order('updated_at', { ascending: false }),
    supabase
      .from('marketing_automation_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('marketing_campaigns')
      .select('id, name, type, status')
      .order('name', { ascending: true }),
    supabase
      .from('marketing_campaign_runs')
      .select('id, revenue_cents, emails_sent, conversions')
      .limit(200),
  ]);

  const automations  = (automationsRes.data  ?? []) as any[];
  const runs         = (runsRes.data         ?? []) as any[];
  const campaigns    = (campaignsRes.data    ?? []) as any[];
  const campaignRuns = (campaignRunsRes.data ?? []) as any[];

  const now   = new Date();
  const today = now.toISOString().slice(0, 10);

  const crById: Record<string, any> = {};
  campaignRuns.forEach((cr: any) => { crById[cr.id] = cr; });

  // ── KPIs ─────────────────────────────────────────────────────────────
  const activeAutomations = automations.filter((a) => a.status === 'active').length;
  const runsToday         = runs.filter((r) => (r.created_at as string)?.slice(0, 10) === today).length;
  const successfulRuns    = runs.filter((r) => r.status === 'completed');
  const failedRunsList    = runs.filter((r) => r.status === 'failed');
  const pendingRuns       = runs.filter((r) => r.status === 'pending' || r.status === 'running');

  const successRate = successfulRuns.length + failedRunsList.length > 0
    ? Math.round(successfulRuns.length / (successfulRuns.length + failedRunsList.length) * 100)
    : 0;

  const revenueGenerated = runs
    .filter((r) => r.campaign_run_id && crById[r.campaign_run_id])
    .reduce((s: number, r) => s + (crById[r.campaign_run_id]?.revenue_cents ?? 0), 0);

  const completedWithTimes = successfulRuns.filter((r) => r.started_at && r.completed_at);
  const avgExecutionSec = completedWithTimes.length > 0
    ? Math.round(
        completedWithTimes.reduce((s: number, r) =>
          s + (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()), 0
        ) / completedWithTimes.length / 1000
      )
    : 0;

  // ── Per-automation aggregates ─────────────────────────────────────────
  const automationById: Record<string, any> = {};
  automations.forEach((a) => { automationById[a.id] = a; });

  const automationList = automations.map((a) => {
    const aRuns    = runs.filter((r) => r.automation_id === a.id);
    const aSuccess = aRuns.filter((r) => r.status === 'completed').length;
    const aFailed  = aRuns.filter((r) => r.status === 'failed').length;
    const aRevenue = aRuns
      .filter((r) => r.campaign_run_id && crById[r.campaign_run_id])
      .reduce((s: number, r) => s + (crById[r.campaign_run_id]?.revenue_cents ?? 0), 0);
    const campaign = (a.marketing_campaigns as any) ?? null;

    return {
      id:            a.id             as string,
      name:          a.name           as string,
      description:   (a.description  ?? '') as string,
      status:        a.status         as AutomationStatus,
      trigger_type:  a.trigger_type   as string,
      campaign:      campaign
        ? { id: campaign.id as string, name: campaign.name as string, type: campaign.type as string }
        : null,
      delay_minutes: (a.delay_minutes ?? 0) as number,
      conditions:    (a.conditions    ?? []) as Condition[],
      metadata:      (a.metadata      ?? {}) as Record<string, unknown>,
      created_at:    a.created_at     as string,
      updated_at:    a.updated_at     as string,
      runsCount:     aRuns.length,
      successCount:  aSuccess,
      failedCount:   aFailed,
      successRate:   aSuccess + aFailed > 0
        ? Math.round(aSuccess / (aSuccess + aFailed) * 100)
        : null,
      revenue:       aRevenue,
    };
  });

  // ── Execution log (most recent 60) ───────────────────────────────────
  const executionLog = runs.slice(0, 60).map((r: any) => ({
    id:             r.id             as string,
    automationId:   r.automation_id  as string,
    automationName: (automationById[r.automation_id]?.name ?? 'Automation') as string,
    profileId:      (r.profile_id    ?? null) as string | null,
    campaignRunId:  (r.campaign_run_id ?? null) as string | null,
    status:         r.status         as string,
    startedAt:      (r.started_at    ?? null) as string | null,
    completedAt:    (r.completed_at  ?? null) as string | null,
    errorMessage:   (r.error_message ?? null) as string | null,
    createdAt:      r.created_at     as string,
  }));

  // ── Runs per day (14 days) ───────────────────────────────────────────
  const runsPerDay = Array.from({ length: 14 }, (_, i) => {
    const d  = new Date(now.getTime() - (13 - i) * 86_400_000);
    const ds = d.toISOString().slice(0, 10);
    const day = runs.filter((r) => (r.created_at as string)?.slice(0, 10) === ds);
    return {
      date:      ds.slice(5),
      total:     day.length,
      completed: day.filter((r) => r.status === 'completed').length,
      failed:    day.filter((r) => r.status === 'failed').length,
    };
  });

  // ── Revenue by automation (top 5) ────────────────────────────────────
  const revenueByAutomation = [...automationList]
    .filter((a) => a.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((a) => ({
      name:    a.name.length > 20 ? a.name.slice(0, 18) + '…' : a.name,
      revenue: a.revenue,
    }));

  // ── Failure reasons (top 5) ──────────────────────────────────────────
  const reasonCounts: Record<string, number> = {};
  failedRunsList.forEach((r) => {
    const k = ((r.error_message as string) ?? 'Erreur inconnue').slice(0, 45);
    reasonCounts[k] = (reasonCounts[k] ?? 0) + 1;
  });
  const failureReasons = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  const data: AutomationData = {
    kpis: {
      activeAutomations,
      runsToday,
      successfulRuns:   successfulRuns.length,
      failedRuns:       failedRunsList.length,
      pendingRuns:      pendingRuns.length,
      revenueGenerated,
      successRate,
      avgExecutionSec,
    },
    automations: automationList,
    campaigns:   campaigns.map((c: any) => ({
      id:     c.id     as string,
      name:   c.name   as string,
      type:   c.type   as string,
      status: c.status as string,
    })),
    executionLog,
    monitoring: { runsPerDay, revenueByAutomation, failureReasons },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Automation Engine</h1>
        <p className="text-silver-500 text-sm font-serif italic">
          Moteur d&apos;automatisation marketing · {activeAutomations} automation{activeAutomations !== 1 ? 's' : ''} active{activeAutomations !== 1 ? 's' : ''}
        </p>
      </div>
      <AutomationCenter data={data} />
    </div>
  );
}
