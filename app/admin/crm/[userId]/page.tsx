export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import CustomerProfile from './CustomerProfile';

export default async function CrmProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  // Validate profile exists before rendering the client component
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('id', userId)
    .single();

  if (!profile) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/crm"
          className="mt-1 p-1.5 rounded-lg text-silver-500 hover:text-silver-300 hover:bg-charcoal border border-transparent hover:border-ash/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-silver-200">{profile.full_name ?? 'Client'}</h1>
          <p className="text-silver-500 text-sm mt-0.5">{profile.email}</p>
        </div>
      </div>

      {/* Profile tabs — data fetched client-side from API */}
      <CustomerProfile userId={userId} />
    </div>
  );
}
