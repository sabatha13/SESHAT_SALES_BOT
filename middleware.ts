import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const isPublicRoute = createRouteMatcher([
  '/',
  '/boutique(.*)',
  '/livre(.*)',
  '/connexion(.*)',
  '/inscription(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
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
  matcher: ['/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
