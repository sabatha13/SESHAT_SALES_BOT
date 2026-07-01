'use server';

import { Resend } from 'resend';

export type ContactState = { error?: string; success?: boolean };

export async function envoyerContact(
  prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const prenom = (formData.get('prenom') as string)?.trim();
  const nom = (formData.get('nom') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const sujet = (formData.get('sujet') as string)?.trim();
  const message = (formData.get('message') as string)?.trim();

  if (!prenom || !nom || !email || !sujet || !message) {
    return { error: 'Tous les champs sont requis.' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── Email admin (bloquant — si échec, on retourne une erreur) ────────────
  try {
    await resend.emails.send({
      from: 'VCE Contact <onboarding@resend.dev>',
      to: 'gpsabatha@gmail.com',
      replyTo: email,
      subject: `[VCE Contact] ${sujet} — ${prenom} ${nom}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h3 style="color:#8A7818">Message via le formulaire de contact VCE</h3>
          <p><strong>De :</strong> ${prenom} ${nom} (<a href="mailto:${email}">${email}</a>)</p>
          <p><strong>Sujet :</strong> ${sujet}</p>
          <hr style="border:none;border-top:1px solid #E8DFB0;margin:1rem 0">
          <p style="white-space:pre-wrap">${message.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });
  } catch {
    return {
      error: "Erreur lors de l'envoi. Veuillez réessayer ou nous écrire directement.",
    };
  }

  // ── Confirmation auteur (non bloquant — échec silencieux) ─────────────────
  try {
    await resend.emails.send({
      from: 'VCE Contact <onboarding@resend.dev>',
      to: email,
      replyTo: 'gpsabatha@gmail.com',
      subject: 'Votre message a bien été reçu ✦ — Voix Cosmique Éditions',
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FEF8E8;padding:2.5rem;color:#000000;">
          <p style="font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:#7A6A10;margin:0 0 1.5rem;">
            Voix Cosmique Éditions
          </p>
          <h2 style="font-size:1.4rem;font-weight:700;color:#000000;margin:0 0 1.5rem;line-height:1.3;">
            Votre voix mérite d'être entendue.
          </h2>
          <p style="font-size:0.95rem;line-height:1.7;margin:0 0 1rem;">
            Nous avons bien reçu votre message et notre équipe vous répondra dans les <strong>24 à 48 heures ouvrées</strong>.
          </p>
          <p style="font-size:0.95rem;line-height:1.7;margin:0 0 1rem;">
            En attendant, sachez ceci : chaque grand livre a commencé par une question, une hésitation, une première phrase hésitante. Ce que vous portez en vous a de la valeur — et nous sommes là pour vous aider à le révéler au monde.
          </p>
          <p style="font-size:0.95rem;line-height:1.7;margin:0 0 2rem;">
            Votre histoire mérite d'exister. Nous sommes là pour ça.
          </p>
          <p style="font-size:0.9rem;color:#7A6A10;font-style:italic;margin:0;border-top:1px solid #E8DFB0;padding-top:1.25rem;">
            — L'équipe Voix Cosmique Éditions
          </p>
        </div>
      `,
    });
  } catch {
    /* confirmation non bloquante */
  }

  return { success: true };
}
