'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase/server';

export type SoumettreManuScritState = { error?: string; success?: boolean };

function tempPassword(): string {
  return Math.random().toString(36).slice(-8) + 'Aa1!';
}

export async function soumettreManuScrit(
  prevState: SoumettreManuScritState,
  formData: FormData
): Promise<SoumettreManuScritState> {
  const prenom = (formData.get('prenom') as string)?.trim();
  const nom = (formData.get('nom') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const whatsapp = (formData.get('whatsapp') as string)?.trim();
  const titre = (formData.get('titre') as string)?.trim();
  const genre = formData.get('genre') as string;
  const nb_pages = parseInt(formData.get('nb_pages') as string) || 0;
  const service_id = (formData.get('service_id') as string) || null;
  const package_id = (formData.get('package_id') as string) || null;
  const synopsis = (formData.get('synopsis') as string)?.trim();
  const fichier = formData.get('fichier') as File | null;
  const source = (formData.get('source') as string) || null;

  if (!prenom || !nom || !email || !titre || !genre || !synopsis) {
    return { error: 'Tous les champs obligatoires doivent être renseignés.' };
  }

  if (!service_id && !package_id) {
    return { error: 'Veuillez choisir un service ou un package éditorial.' };
  }

  const supabase = createServerClient();

  // 1. Trouver ou créer l'auteur
  let auteurId: string;

  const { data: auteurExistant } = await supabase
    .from('vce_auteurs')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (auteurExistant) {
    auteurId = auteurExistant.id;
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword(),
      email_confirm: true,
    });

    if (authError || !authData?.user?.id) {
      if (authError?.message?.toLowerCase().includes('already')) {
        return {
          error:
            'Un compte existe déjà avec cet email. Connectez-vous à votre espace auteur pour soumettre votre manuscrit.',
        };
      }
      return { error: 'Erreur lors de la création de votre dossier. Veuillez réessayer.' };
    }

    const { data: nouvelAuteur, error: profileError } = await supabase
      .from('vce_auteurs')
      .insert({ auth_user_id: authData.user.id, prenom, nom, email })
      .select('id')
      .single();

    if (profileError || !nouvelAuteur) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { error: 'Erreur lors de la création du profil auteur. Veuillez réessayer.' };
    }

    auteurId = nouvelAuteur.id;
  }

  // 2. Calculer le montant total
  let montantTotal = 0;
  let serviceId: string | null = null;
  let packageId: string | null = null;

  if (package_id) {
    const { data: pkg } = await supabase
      .from('vce_service_packages')
      .select('prix')
      .eq('id', package_id)
      .single();
    montantTotal = pkg ? parseFloat(String(pkg.prix)) : 0;
    packageId = package_id;
  } else if (service_id) {
    const { data: svc } = await supabase
      .from('vce_services')
      .select('*')
      .eq('id', service_id)
      .single();

    if (svc) {
      serviceId = service_id;
      if (svc.type_tarif === 'fixe') {
        montantTotal = parseFloat(String(svc.prix_fixe)) || 0;
      } else {
        if (nb_pages <= 100) montantTotal = parseFloat(String(svc.prix_0_100)) || 0;
        else if (nb_pages <= 200) montantTotal = parseFloat(String(svc.prix_100_200)) || 0;
        else if (nb_pages <= 300) montantTotal = parseFloat(String(svc.prix_200_300)) || 0;
        else montantTotal = parseFloat(String(svc.prix_300_400)) || 0;
      }
    }
  }

  // 3. Créer la commande de service éditorial
  const { data: commande, error: commandeError } = await supabase
    .from('vce_commandes_services')
    .insert({
      auteur_id: auteurId,
      service_id: serviceId,
      package_id: packageId,
      titre,
      montant_total: montantTotal,
      acompte_paye: 0,
      solde_restant: montantTotal,
      statut: 'briefing',
    })
    .select('id')
    .single();

  if (commandeError || !commande) {
    return { error: "Erreur lors de l'enregistrement de votre demande. Veuillez réessayer." };
  }

  // 4. Upload du manuscrit vers Supabase Storage
  if (fichier && fichier.size > 0) {
    const buffer = await fichier.arrayBuffer();
    const fileName = `${auteurId}/${commande.id}/${Date.now()}_${fichier.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vce-manuscripts')
      .upload(fileName, buffer, {
        contentType: fichier.type || 'application/octet-stream',
      });

    if (!uploadError && uploadData) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('vce-manuscripts').getPublicUrl(uploadData.path);

      await supabase.from('vce_fichiers').insert({
        commande_id: commande.id,
        auteur_id: auteurId,
        nom_fichier: fichier.name,
        url: publicUrl,
        taille_bytes: fichier.size,
        type_fichier: 'manuscrit',
        envoye_par: 'auteur',
      });
    }
  }

  // 5. Message initial (synopsis + métadonnées)
  await supabase.from('vce_messages').insert({
    commande_id: commande.id,
    expediteur: 'auteur',
    expediteur_nom: `${prenom} ${nom}`,
    contenu: [
      `Genre : ${genre}${nb_pages ? ` — ${nb_pages} pages` : ''}`,
      whatsapp ? `WhatsApp : ${whatsapp}` : null,
      source ? `Source : ${source}` : null,
      '',
      'Synopsis :',
      synopsis,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  // 6. Emails (non bloquants)
  const ref = commande.id.slice(0, 8).toUpperCase();
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await Promise.allSettled([
      resend.emails.send({
        from: 'Voix Cosmique Éditions <onboarding@resend.dev>',
        to: email,
        subject: `Votre manuscrit "${titre}" a bien été reçu`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1C1208;padding:2rem;">
            <h2 style="color:#8A7818;font-size:1.5rem;">Merci, ${prenom} !</h2>
            <p>Nous avons bien reçu votre soumission pour <strong>"${titre}"</strong>.</p>
            <p>Notre équipe éditoriale va l'examiner et vous contactera sous <strong>48 à 72h</strong> pour convenir d'un appel de briefing.</p>
            <div style="background:#FAF3E0;padding:1rem 1.5rem;border-left:3px solid #B5A020;margin:1.5rem 0;">
              Numéro de dossier : <strong>#${ref}</strong>
            </div>
            <p>À très bientôt,<br><em>L'équipe Voix Cosmique Éditions</em></p>
          </div>
        `,
      }),
      resend.emails.send({
        from: 'VCE Bot <onboarding@resend.dev>',
        to: 'technoreport2015@gmail.com',
        subject: `[VCE] Nouveau dossier #${ref} — "${titre}" / ${prenom} ${nom}`,
        html: `
          <h3>Nouvelle soumission de manuscrit</h3>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
            <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold">Auteur</td><td style="padding:6px 12px">${prenom} ${nom}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px">${email}</td></tr>
            <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold">WhatsApp</td><td style="padding:6px 12px">${whatsapp || '—'}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold">Titre</td><td style="padding:6px 12px">${titre}</td></tr>
            <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold">Genre</td><td style="padding:6px 12px">${genre}${nb_pages ? ` — ${nb_pages} pages` : ''}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold">Montant estimé</td><td style="padding:6px 12px">$${montantTotal.toFixed(2)}</td></tr>
            <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold">Source</td><td style="padding:6px 12px">${source || '—'}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold">ID dossier</td><td style="padding:6px 12px">${commande.id}</td></tr>
          </table>
          <h4>Synopsis</h4>
          <p style="background:#f9f9f9;padding:1rem;border-radius:4px">${synopsis.replace(/\n/g, '<br>')}</p>
        `,
      }),
    ]);
  } catch {
    /* emails non bloquants */
  }

  redirect(`/soumettre/confirmation?ref=${ref}`);
}
