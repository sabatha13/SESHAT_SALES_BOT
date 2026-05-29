import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { Download } from 'lucide-react';

export default async function AdminTelechargementsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const supabase = createServerClient();
  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!admin?.is_admin) redirect('/');

  const { data: downloads } = await supabase
    .from('downloads')
    .select('*, profile:profiles(email, full_name), book:books(title)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Download className="w-6 h-6 text-gold-400" />
        <div>
          <h1 className="font-serif text-2xl gold-text">Téléchargements</h1>
          <p className="text-silver-500 text-sm">Journal d'audit des {downloads?.length || 0} derniers téléchargements</p>
        </div>
      </div>

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ash/50">
            <tr className="text-left">
              {['Livre', 'Utilisateur', 'IP', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ash/30">
            {downloads?.map((dl: any) => (
              <tr key={dl.id} className="hover:bg-charcoal/50 transition-colors">
                <td className="px-4 py-3 text-silver-200">{dl.book?.title || '—'}</td>
                <td className="px-4 py-3">
                  <p className="text-silver-300">{dl.profile?.full_name || '—'}</p>
                  <p className="text-silver-500 text-xs">{dl.profile?.email}</p>
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs font-mono">{dl.ip_address || '—'}</td>
                <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(dl.created_at)}</td>
              </tr>
            ))}
            {(!downloads || downloads.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-silver-500">Aucun téléchargement enregistré</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
