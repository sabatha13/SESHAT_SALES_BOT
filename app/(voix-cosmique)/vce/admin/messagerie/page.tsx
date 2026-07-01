export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

interface MessageRow {
  id: string;
  commande_id: string | null;
  expediteur: string | null;
  contenu: string;
  lu: boolean | null;
  created_at: string | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminMessageriePage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: messagesData }, { data: commandesData }, { data: auteursData }] = await Promise.all([
    supabase.from('vce_messages').select('id, commande_id, expediteur, contenu, lu, created_at').order('created_at', { ascending: false }),
    supabase.from('vce_commandes_services').select('id, titre, auteur_id'),
    supabase.from('vce_auteurs').select('id, prenom, nom'),
  ]);

  const messages = (messagesData ?? []) as MessageRow[];
  const commandeMap = new Map((commandesData ?? []).map((c) => [c.id, c]));
  const auteurMap = new Map((auteursData ?? []).map((a) => [a.id, `${a.prenom} ${a.nom}`]));

  // Regroupe par commande_id
  const fils = new Map<
    string,
    { commandeId: string; total: number; nonLus: number; dernier: MessageRow }
  >();
  for (const m of messages) {
    if (!m.commande_id) continue;
    const existing = fils.get(m.commande_id);
    const estNonLu = m.lu === false && m.expediteur === 'auteur';
    if (!existing) {
      fils.set(m.commande_id, {
        commandeId: m.commande_id,
        total: 1,
        nonLus: estNonLu ? 1 : 0,
        dernier: m, // messages triés desc → premier vu = plus récent
      });
    } else {
      existing.total += 1;
      if (estNonLu) existing.nonLus += 1;
    }
  }

  const filsList = Array.from(fils.values()).sort(
    (a, b) => new Date(b.dernier.created_at ?? 0).getTime() - new Date(a.dernier.created_at ?? 0).getTime(),
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 2rem' }}>
        Messagerie
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 400, color: 'var(--accent-or-texte)', marginLeft: '0.75rem' }}>
          ({filsList.length} fil{filsList.length > 1 ? 's' : ''})
        </span>
      </h1>

      {filsList.length === 0 ? (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun message.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filsList.map((fil) => {
            const commande = commandeMap.get(fil.commandeId);
            const auteurNom = commande?.auteur_id ? auteurMap.get(commande.auteur_id) ?? '—' : '—';
            return (
              <Link
                key={fil.commandeId}
                href={`/admin/commandes/${fil.commandeId}`}
                style={{
                  background: 'var(--carte)',
                  border: '1px solid var(--carte-bordure)',
                  borderRadius: '8px',
                  padding: '1.1rem 1.4rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--texte-carte)' }}>
                      {commande?.titre ?? 'Commande inconnue'}
                    </span>
                    {fil.nonLus > 0 && (
                      <span style={{ background: '#991B1B', color: '#FFFFFF', fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                        {fil.nonLus} non lu{fil.nonLus > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)', margin: '0 0 0.2rem' }}>
                    {auteurNom} · {fil.total} message{fil.total > 1 ? 's' : ''}
                  </p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fil.dernier.expediteur === 'auteur' ? 'Auteur : ' : 'VCE : '}{fil.dernier.contenu}
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'var(--texte-carte-secondaire)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {formatDateTime(fil.dernier.created_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
