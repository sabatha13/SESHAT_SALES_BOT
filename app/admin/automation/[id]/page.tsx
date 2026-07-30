export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import AutomationDetail from './AutomationDetail';
import type { AutomationDetailData } from './AutomationDetail';

export default async function AutomationDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createServerClient();

  const [automationRes, runsRes, campaignRunsRes] = await Promise.all([
    supabase
      .from('marketing_automations')
      .select('*, marketing_campaigns(id, name, type, status)')
      .eq('id', id)
      .single(),
    supabase
      .from('marketing_automation_runs')
      .select('*')
      .eq('automation_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('marketing_campaign_runs')
      .select('id, revenue_cents')
      .limit(100),
  ]);

  if (!automationRes.data || automationRes.error) notFound();

  const a   = automationRes.data as any;
  const runs = (runsRes.data ?? []) as any[];

  const crById: Record<string, any> = {};
  ((campaignRunsRes.data ?? []) as any[]).forEach((cr) => { crById[cr.id] = cr; });

  const successCount = runs.filter((r) => r.status === 'completed').length;
  const failedCount  = runs.filter((r) => r.status === 'failed').length;
  const revenue      = runs
    .filter((r) => r.campaign_run_id && crById[r.campaign_run_id])
    .reduce((s: number, r) => s + (crById[r.campaign_run_id]?.revenue_cents ?? 0), 0);
  const successRate = successCount + failedCount > 0
    ? Math.round(successCount / (successCount + failedCount) * 100)
    : 0;

  const campaign = (a.marketing_campaigns as any) ?? null;

  const data: AutomationDetailData = {
    id:            a.id,
    name:          a.name,
    description:   a.description ?? '',
    status:        a.status,
    trigger_type:  a.trigger_type,
    campaign:      campaign
      ? { id: campaign.id, name: campaign.name, type: campaign.type, status: campaign.status }
      : null,
    delay_minutes: a.delay_minutes ?? 0,
    conditions:    (a.conditions ?? []) as Array<{ key: string; operator: string; value: string }>,
    metadata:      (a.metadata ?? {}) as Record<string, unknown>,
    created_at:    a.created_at,
    updated_at:    a.updated_at,
    created_by:    a.created_by ?? null,
    metrics:       { totalRuns: runs.length, successCount, failedCount, revenue, successRate },
    recentRuns:    runs.slice(0, 50).map((r) => ({
      id:            r.id,
      status:        r.status,
      startedAt:     r.started_at     ?? null,
      completedAt:   r.completed_at   ?? null,
      errorMessage:  r.error_message  ?? null,
      campaignRunId: r.campaign_run_id ?? null,
      profileId:     r.profile_id     ?? null,
      createdAt:     r.created_at,
    })),
  };

  return (
    <div className="space-y-6">
      <AutomationDetail data={data} />
    </div>
  );
}
