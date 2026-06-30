import { createServerClient } from '@/lib/supabase/server';

export async function assertAdmin(clerkUserId: string): Promise<void> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_user_id', clerkUserId)
    .single();
  if (error || !data?.is_admin) throw new Error('Accès refusé');
}
