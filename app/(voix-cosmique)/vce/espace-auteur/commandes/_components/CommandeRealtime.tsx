'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandeData {
  id: string;
  titre: string;
  statut: string;
  progression: number;
  date_livraison_estimee: string | null;
}

export interface EtapeData {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  ordre: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, string> = {
  briefing: 'Briefing',
  devis_envoye: 'Devis envoyé',
  production: 'En production',
  revision: 'Révision',
  livre: 'Livré',
  termine: 'Terminé',
};

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  briefing: { bg: '#FEF3C7', text: '#92400E' },
  devis_envoye: { bg: '#DBEAFE', text: '#1E40AF' },
  production: { bg: '#EDE9FE', text: '#5B21B6' },
  revision: { bg: '#FEF9C3', text: '#713F12' },
  livre: { bg: '#DCFCE7', text: '#166534' },
  termine: { bg: '#F3F4F6', text: '#374151' },
};

const ETAPE_STATUT_ICONS: Record<string, { icon: string; color: string }> = {
  termine: { icon: '✓', color: '#3A9E6E' },
  en_cours: { icon: '●', color: '#B5A020' },
  en_attente: { icon: '○', color: '#C4B08A' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CommandeRealtime({
  commandeId,
  commandeInitiale,
  etapesInitiales,
}: {
  commandeId: string;
  commandeInitiale: CommandeData;
  etapesInitiales: EtapeData[];
}) {
  const [commande, setCommande] = useState<CommandeData>(commandeInitiale);
  const [etapes, setEtapes] = useState<EtapeData[]>(etapesInitiales);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const channel = supabase
      .channel(`commande-detail-${commandeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vce_commandes_services',
          filter: `id=eq.${commandeId}`,
        },
        (payload) => {
          setCommande((prev) => ({ ...prev, ...(payload.new as CommandeData) }));
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vce_etapes',
          filter: `commande_id=eq.${commandeId}`,
        },
        (payload) => {
          setEtapes((prev) =>
            [...prev, payload.new as EtapeData].sort(
              (a, b) => (a.ordre ?? 0) - (b.ordre ?? 0),
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vce_etapes',
          filter: `commande_id=eq.${commandeId}`,
        },
        (payload) => {
          setEtapes((prev) =>
            prev.map((e) =>
              e.id === (payload.new as EtapeData).id
                ? { ...e, ...(payload.new as EtapeData) }
                : e,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'vce_etapes',
          filter: `commande_id=eq.${commandeId}`,
        },
        (payload) => {
          setEtapes((prev) =>
            prev.filter((e) => e.id !== (payload.old as { id: string }).id),
          );
        },
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commandeId]);

  const couleurs = STATUT_COLORS[commande.statut] ?? { bg: '#F3F4F6', text: '#374151' };

  return (
    <div>
      {/* ── Statut + Progression ──────────────────────────────────────────── */}
      <div
        style={{
          background: '#FFFEF5',
          border: '1px solid #E8DFB0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                background: couleurs.bg,
                color: couleurs.text,
                padding: '0.3rem 0.8rem',
                borderRadius: '999px',
              }}
            >
              {STATUT_LABELS[commande.statut] ?? commande.statut}
            </span>
            {/* Indicateur Realtime */}
            <span
              title={connected ? 'Suivi en temps réel actif' : 'Connexion…'}
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: connected ? '#3A9E6E' : '#C4B08A',
                display: 'inline-block',
              }}
            />
          </div>

          {commande.date_livraison_estimee && (
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#6B4C2F',
              }}
            >
              Livraison estimée : {formatDate(commande.date_livraison_estimee)}
            </span>
          )}
        </div>

        {/* Barre de progression */}
        <div style={{ marginBottom: '0.4rem' }}>
          <div
            style={{
              background: '#E8DFB0',
              borderRadius: '999px',
              height: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#B5A020',
                height: '100%',
                width: `${commande.progression ?? 0}%`,
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: '#8A7818',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {commande.progression ?? 0} % complété
        </p>
      </div>

      {/* ── Étapes ────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#FFFEF5',
          border: '1px solid #E8DFB0',
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#3D2B1A',
            margin: '0 0 1.25rem',
          }}
        >
          Étapes du projet
        </h3>

        {etapes.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.875rem',
              color: '#6B4C2F',
              margin: 0,
            }}
          >
            Les étapes seront définies lors du briefing initial.
          </p>
        ) : (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {etapes.map((etape, idx) => {
              const icone = ETAPE_STATUT_ICONS[etape.statut] ?? ETAPE_STATUT_ICONS.en_attente;
              const isLast = idx === etapes.length - 1;
              return (
                <li
                  key={etape.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: isLast ? 0 : '1.25rem',
                    position: 'relative',
                  }}
                >
                  {/* Ligne verticale entre étapes */}
                  {!isLast && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '11px',
                        top: '22px',
                        bottom: 0,
                        width: '2px',
                        background: '#E8DFB0',
                      }}
                    />
                  )}

                  {/* Icône statut */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `2px solid ${icone.color}`,
                      background: etape.statut === 'termine' ? icone.color : '#FFFEF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      color: etape.statut === 'termine' ? '#FFFEF5' : icone.color,
                      fontWeight: 700,
                      flexShrink: 0,
                      zIndex: 1,
                      position: 'relative',
                    }}
                  >
                    {icone.icon}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, paddingTop: '2px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.2rem',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: etape.statut === 'en_attente' ? '#8A7818' : '#3D2B1A',
                          margin: 0,
                        }}
                      >
                        {etape.titre}
                      </p>
                      {etape.statut === 'en_cours' && (
                        <span
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '999px',
                          }}
                        >
                          EN COURS
                        </span>
                      )}
                    </div>
                    {etape.description && (
                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.8rem',
                          color: '#6B4C2F',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {etape.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
