import { createServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, Ban } from 'lucide-react';
import Link from 'next/link';

async function getUsers() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('*, purchases(id)')
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function UtilisateursPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Utilisateurs</h1>
        <p className="text-silver-500 text-sm">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/50">
              {['Utilisateur', 'Email', 'Achats', 'Role', 'Inscrit le'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-ash/20 hover:bg-charcoal/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/utilisateurs/${u.id}`} className="text-silver-300 text-sm hover:text-gold-400 transition-colors">
                    {u.full_name || 'Sans nom'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-silver-500 text-sm">{u.email}</td>
                <td className="px-4 py-3 text-silver-300 text-sm">{u.purchases?.length || 0}</td>
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <span className="flex items-center gap-1 text-red-400 text-xs">
                      <Ban className="w-3 h-3" /> Suspendu
                    </span>
                  ) : u.is_admin ? (
                    <span className="flex items-center gap-1 text-gold-400 text-xs">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="text-silver-500 text-xs">Membre</span>
                  )}
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}