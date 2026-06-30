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

  // Protect /espace-auteur/* — validate Supabase JWT, not just cookie presence
  if (pathname.startsWith('/espace-auteur')) {
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
    if (error) return NextResponse.redirect(loginUrl);
  }

  // Rewrite VCE host paths to internal /vce/* prefix (keeps URL unchanged for user)
  const rewritten = req.nextUrl.clone();
  rewritten.pathname = `/vce${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(rewritten);
}

// ─── CDS public routes (Clerk) ────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  '/',
  '/boutique(.*)',
  '/livre(.*)',
  '/connexion(.*)',
  '/inscription(.*)',
  '/api/webhooks(.*)',
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
