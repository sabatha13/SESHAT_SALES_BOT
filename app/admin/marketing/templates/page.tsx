export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import EmailTemplateManager from './EmailTemplateManager';
import type { TemplateData, TemplateItem, TemplateCategory, TemplateStatus } from './EmailTemplateManager';

export default async function EmailTemplatesPage() {
  const supabase = createServerClient();

  const [templatesRes, campaignsRes, automationsRes] = await Promise.all([
    supabase
      .from('marketing_email_templates')
      .select('*')
      .order('updated_at', { ascending: false }),
    supabase
      .from('marketing_campaigns')
      .select('id, name, template_id')
      .not('template_id', 'is', null),
    supabase
      .from('marketing_automations')
      .select('id, name, template_id')
      .not('template_id', 'is', null),
  ]);

  const templates   = (templatesRes.data   ?? []) as any[];
  const campaigns   = (campaignsRes.data   ?? []) as any[];
  const automations = (automationsRes.data ?? []) as any[];

  const usageMap: Record<string, {
    campaigns:   { id: string; name: string }[];
    automations: { id: string; name: string }[];
  }> = {};

  campaigns.forEach((c) => {
    if (!c.template_id) return;
    usageMap[c.template_id] ??= { campaigns: [], automations: [] };
    usageMap[c.template_id].campaigns.push({ id: c.id, name: c.name });
  });
  automations.forEach((a) => {
    if (!a.template_id) return;
    usageMap[a.template_id] ??= { campaigns: [], automations: [] };
    usageMap[a.template_id].automations.push({ id: a.id, name: a.name });
  });

  const templateList: TemplateItem[] = templates.map((t) => ({
    id:                t.id                      as string,
    name:              t.name                    as string,
    description:       (t.description  ?? '')    as string,
    category:          t.category                as TemplateCategory,
    subject:           t.subject                 as string,
    html_body:         t.html_body               as string,
    text_body:         (t.text_body    ?? '')    as string,
    variables:         (t.variables    ?? [])    as string[],
    status:            t.status                  as TemplateStatus,
    usage_count:       (t.usage_count  ?? 0)     as number,
    last_used_at:      (t.last_used_at ?? null)  as string | null,
    created_at:        t.created_at              as string,
    updated_at:        t.updated_at              as string,
    linkedCampaigns:   usageMap[t.id]?.campaigns   ?? [],
    linkedAutomations: usageMap[t.id]?.automations ?? [],
  }));

  const catCounts: Record<string, number> = {};
  templates.forEach((t) => { catCounts[t.category] = (catCounts[t.category] ?? 0) + 1; });

  const data: TemplateData = {
    templates: templateList,
    kpis: {
      total:      templates.length,
      active:     templates.filter((t) => t.status === 'active').length,
      draft:      templates.filter((t) => t.status === 'draft').length,
      totalUsage: templates.reduce((s, t) => s + (t.usage_count ?? 0), 0),
    },
    categoryBreakdown: catCounts,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Email Templates</h1>
        <p className="text-silver-500 text-sm font-serif italic">
          Gestionnaire de templates · {templateList.length} template{templateList.length !== 1 ? 's' : ''}
        </p>
      </div>
      <EmailTemplateManager data={data} />
    </div>
  );
}
