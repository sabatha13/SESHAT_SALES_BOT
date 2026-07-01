import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

export async function GET() {
  // Protection admin — redirige si non autorisé (assertVceAdmin appelle redirect())
  await assertVceAdmin();

  const supabase = createServerClient();
  const { data: abonnes } = await supabase
    .from('vce_newsletter_abonnes')
    .select('email, prenom, source, is_active, date_abonnement')
    .order('date_abonnement', { ascending: false });

  // Échappement CSV : entoure de guillemets et double les guillemets internes
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = ['email', 'prenom', 'source', 'is_active', 'date_abonnement'];
  const lines = [header.join(',')];
  for (const a of abonnes ?? []) {
    lines.push(
      [a.email, a.prenom, a.source, a.is_active, a.date_abonnement].map(escape).join(','),
    );
  }
  // BOM UTF-8 pour un affichage correct des accents dans Excel
  const csv = '﻿' + lines.join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="newsletter-vce-${dateStr}.csv"`,
    },
  });
}
