'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createClient } from '@supabase/supabase-js';
import { envoyerMessage, type MessagerieState } from '../../../../actions/messagerie';
import type { MessageData } from '../page';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHeure(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatJour(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function memeJour(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ─── Bouton d'envoi ───────────────────────────────────────────────────────────

function EnvoyerButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        fontFamily: 'var(--font-inter)',
        background: pending ? '#C4B08A' : '#B5A020',
        color: '#FAF3E0',
        border: 'none',
        padding: '0.65rem 1.25rem',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: pending ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        alignSelf: 'flex-end',
      }}
    >
      {pending ? 'Envoi…' : 'Envoyer'}
    </button>
  );
}

// ─── Bulle de message ─────────────────────────────────────────────────────────

function BulleMessage({ msg, estAuteur }: { msg: MessageData; estAuteur: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: estAuteur ? 'flex-end' : 'flex-start',
        marginBottom: '0.5rem',
      }}
    >
      {!estAuteur && msg.expediteur_nom && (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: '#8A7818',
            margin: '0 0 0.2rem 0.25rem',
            letterSpacing: '0.03em',
          }}
        >
          {msg.expediteur_nom}
        </p>
      )}
      <div
        style={{
          maxWidth: '75%',
          background: estAuteur ? '#B5A020' : '#FFFEF5',
          color: estAuteur ? '#FAF3E0' : '#3D2B1A',
          border: estAuteur ? 'none' : '1px solid #E8DFB0',
          borderRadius: estAuteur ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          padding: '0.65rem 0.875rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
            margin: 0,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.contenu}
        </p>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.65rem',
          color: '#C4B08A',
          marginTop: '0.2rem',
          padding: '0 0.25rem',
        }}
      >
        {formatHeure(msg.created_at)}
      </span>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const initialState: MessagerieState = {};

export default function FilDiscussion({
  commandeId,
  messagesInitiaux,
  token,
}: {
  commandeId: string;
  messagesInitiaux: MessageData[];
  // Le JWT est exposé au JS client volontairement pour permettre l'auth Realtime
  // — accepté car durée de vie 1h et app à accès restreint. Voir audit sécurité 30 juin 2026.
  token: string;
}) {
  const [messages, setMessages] = useState<MessageData[]>(messagesInitiaux);
  const [connected, setConnected] = useState(false);
  const [state, formAction] = useFormState(envoyerMessage, initialState);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset du formulaire après envoi réussi
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }, [state.success]);

  // Subscription Realtime — INSERT uniquement (messages immutables)
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      // Le JWT est exposé au JS client volontairement pour permettre l'auth Realtime
      // — accepté car durée de vie 1h et app à accès restreint. Voir audit sécurité 30 juin 2026.
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    const channel = supabase
      .channel(`messagerie-${commandeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vce_messages',
          filter: `commande_id=eq.${commandeId}`,
        },
        (payload) => {
          const nouveau = payload.new as MessageData;
          setMessages((prev) => {
            // Évite les doublons si le Server Action a déjà revalidatePath
            if (prev.some((m) => m.id === nouveau.id)) return prev;
            return [...prev, nouveau];
          });
        },
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commandeId, token]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: '#FFFEF5',
        border: '1px solid #E8DFB0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Barre statut Realtime */}
      <div
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '1px solid #E8DFB0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: '#FAF3E0',
          flexShrink: 0,
        }}
      >
        <span
          title={connected ? 'Temps réel actif' : 'Connexion…'}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: connected ? '#3A9E6E' : '#C4B08A',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            color: '#8A7818',
          }}
        >
          {connected ? 'Temps réel' : 'Connexion…'}
        </span>
      </div>

      {/* Zone des messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#8A7818',
                margin: 0,
              }}
            >
              Aucun message pour l'instant. Envoyez le premier !
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const estAuteur = msg.expediteur === 'auteur';
            const precedent = idx > 0 ? messages[idx - 1] : null;
            const nouvelleJournee = !memeJour(precedent?.created_at ?? null, msg.created_at);

            return (
              <div key={msg.id}>
                {nouvelleJournee && (
                  <div
                    style={{
                      textAlign: 'center',
                      margin: '1rem 0 0.75rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.7rem',
                        color: '#8A7818',
                        background: '#F5EDD0',
                        padding: '0.2rem 0.75rem',
                        borderRadius: '999px',
                      }}
                    >
                      {formatJour(msg.created_at)}
                    </span>
                  </div>
                )}
                <BulleMessage msg={msg} estAuteur={estAuteur} />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Formulaire d'envoi */}
      <div
        style={{
          borderTop: '1px solid #E8DFB0',
          padding: '0.875rem 1rem',
          background: '#FAF3E0',
          flexShrink: 0,
        }}
      >
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="commande_id" value={commandeId} />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              name="contenu"
              placeholder="Écrivez votre message…"
              rows={2}
              maxLength={5000}
              required
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 150)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              style={{
                flex: 1,
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#3D2B1A',
                background: '#FFFEF5',
                border: '1px solid #C4B08A',
                borderRadius: '4px',
                padding: '0.6rem 0.75rem',
                resize: 'none',
                lineHeight: 1.5,
                outline: 'none',
              }}
            />
            <EnvoyerButton />
          </div>
          {state.error && (
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#B91C1C',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '4px',
                padding: '0.5rem 0.75rem',
                margin: '0.5rem 0 0',
              }}
            >
              {state.error}
            </p>
          )}
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.65rem',
              color: '#C4B08A',
              margin: '0.35rem 0 0',
            }}
          >
            Entrée pour envoyer · Maj+Entrée pour un saut de ligne
          </p>
        </form>
      </div>
    </div>
  );
}
