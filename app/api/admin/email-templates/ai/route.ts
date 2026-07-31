import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 503 });

    const body = await req.json();
    const { action, content, context } = body as {
      action: 'improve_headline' | 'rewrite_paragraph' | 'improve_cta' | 'improve_subject' | 'shorten' | 'increase_conversion';
      content: string;
      context?: string;
    };

    const prompts: Record<typeof action, string> = {
      improve_headline: `Tu es un expert en copywriting pour emails marketing. Améliore ce titre d'email pour qu'il soit plus percutant, émotionnel et engage le lecteur à ouvrir l'email. Réponds uniquement avec le titre amélioré, sans guillemets ni explication.\n\nTitre actuel : ${content}`,
      rewrite_paragraph: `Tu es un expert en copywriting pour emails marketing en français. Réécris ce paragraphe pour qu'il soit plus clair, convaincant et engageant. Conserve les variables {{entre accolades}}. Réponds uniquement avec le texte réécrit.\n\nTexte actuel : ${content}`,
      improve_cta: `Tu es un expert en copywriting pour emails marketing. Améliore ce texte de bouton d'appel à l'action pour qu'il soit plus incitatif et orienté action. Réponds uniquement avec le texte du bouton, court (2-5 mots), sans explication.\n\nTexte actuel : ${content}`,
      improve_subject: `Tu es un expert en email marketing. Améliore cette ligne d'objet d'email pour maximiser le taux d'ouverture. Elle doit être courte (< 50 caractères), créer de la curiosité ou de l'urgence, et conserver les variables {{entre accolades}}. Réponds uniquement avec l'objet amélioré.\n\nObjet actuel : ${content}`,
      shorten: `Raccourcis ce texte d'email en conservant l'essentiel du message et les variables {{entre accolades}}. Réponds uniquement avec le texte raccourci.\n\nTexte : ${content}`,
      increase_conversion: `Tu es un expert en optimisation de conversion pour emails marketing. Réécris ce texte pour augmenter le taux de conversion (clics, achats). Ajoute de l'urgence, de la valeur perçue ou de la preuve sociale si pertinent. Conserve les variables {{entre accolades}}. Réponds uniquement avec le texte optimisé.\n\nTexte : ${content}${context ? `\nContexte : ${context}` : ''}`,
    };

    const prompt = prompts[action];
    if (!prompt) return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: (err as any).error?.message ?? 'Erreur API' }, { status: 500 });
    }

    const data = await res.json();
    const improved = (data.content?.[0]?.text ?? '').trim();
    return NextResponse.json({ improved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
