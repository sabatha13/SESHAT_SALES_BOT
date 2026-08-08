import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── VCE host detection ───────────────────────────────────────────────────────

const VCE_HOST = 'voixcosmique.cdslibrairie.com';

function isVCERequest(req: NextRequest): boolean {
  const host = req.headers.get('host') ?? '';
  return host === VCE_HOST || host.startsWith(VCE_HOST + ':');
}

async function handleVCERequest(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // /api/* est déjà servi à son chemin réel (app/api/vce/...) — pas de préfixe /vce à appliquer
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // /vce/* est déjà au bon chemin interne — fichiers de convention
  // Next.js (opengraph-image, sitemap, robots...) générés sous vce/
  if (pathname.startsWith('/vce')) {
    return NextResponse.next();
  }

  // Tokens rafraîchis pendant cette requête (posés sur la réponse finale, s'il y a lieu)
  let refreshedAccessToken: string | null = null;
  let refreshedRefreshToken: string | null = null;

  // Protect /espace-auteur/* et /admin/* — validate Supabase JWT, refresh si expiré avant de rediriger
  if (pathname.startsWith('/espace-auteur') || pathname.startsWith('/admin')) {
    const token = req.cookies.get('vce_auth_session')?.value;
    const loginUrl = new URL('/connexion', req.url);
    loginUrl.searchParams.set('from', pathname);

    if (!token) return NextResponse.redirect(loginUrl);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await supabase.auth.getUser(token);

    if (error) {
      // Access token expiré/invalide — tente un refresh avant de rediriger vers /connexion
      const refreshToken = req.cookies.get('vce_auth_refresh')?.value;
      if (!refreshToken) return NextResponse.redirect(loginUrl);

      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
      const refreshData = await refreshRes.json();

      if (!refreshRes.ok || !refreshData.access_token || !refreshData.refresh_token) {
        return NextResponse.redirect(loginUrl);
      }

      refreshedAccessToken = refreshData.access_token;
      refreshedRefreshToken = refreshData.refresh_token;
    }
  }

  // Rewrite VCE host paths to internal /vce/* prefix (keeps URL unchanged for user)
  const rewritten = req.nextUrl.clone();
  rewritten.pathname = `/vce${pathname === '/' ? '' : pathname}`;

  // Si un refresh a eu lieu, propage le nouvel access token à CETTE requête
  // (pour que le Server Component/Action en aval voie un cookie déjà valide)
  let requestHeaders = req.headers;
  if (refreshedAccessToken) {
    requestHeaders = new Headers(req.headers);
    const existingCookie = requestHeaders.get('cookie') ?? '';
    const withoutOldSession = existingCookie
      .split('; ')
      .filter((c) => !c.startsWith('vce_auth_session='))
      .join('; ');
    requestHeaders.set(
      'cookie',
      `${withoutOldSession}${withoutOldSession ? '; ' : ''}vce_auth_session=${refreshedAccessToken}`
    );
  }

  const response = refreshedAccessToken
    ? NextResponse.rewrite(rewritten, { request: { headers: requestHeaders } })
    : NextResponse.rewrite(rewritten);

  // Persiste les nouveaux tokens côté navigateur — mêmes options que setSessionCookies()
  if (refreshedAccessToken && refreshedRefreshToken) {
    response.cookies.set('vce_auth_session', refreshedAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
    response.cookies.set('vce_auth_refresh', refreshedRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

// ─── CDS public routes (Clerk) ────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  '/',
  '/boutique(.*)',
  '/livre(.*)',
  '/connexion(.*)',
  '/inscription(.*)',
  '/api/webhooks(.*)',
  '/api/cron/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // VCE subdomain — bypass Clerk, use Supabase session
  if (isVCERequest(req as NextRequest)) {
    return await handleVCERequest(req as NextRequest);
  }

  // CDS — Clerk auth guard
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/connexion', req.url);
      return NextResponse.redirect(signInUrl);
    }
    // Update last_seen_at — fire and forget, never blocks the response
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('clerk_user_id', userId);
    } catch {
      // intentionally silent
    }
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
