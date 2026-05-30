import { createServerClient } from '@/lib/supabase/server';
import VentesClient from './VentesClient';

export const dynamic = 'force-dynamic';

export default async function VentesPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('purchases')
    .select('*, profiles(email, full_name), books(title, cover_url)')
    .order('created_at', { ascending: false });
  return <VentesClient sales={data || []} />;
}