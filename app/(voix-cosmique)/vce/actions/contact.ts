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

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'VCE Contact <onboarding@resend.dev>',
      to: 'technoreport2015@gmail.com',
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

    return { success: true };
  } catch {
    return {
      error: "Erreur lors de l'envoi. Veuillez réessayer ou nous écrire directement.",
    };
  }
}
