'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Ban, Crown, Search, BookOpen, ShoppingBag } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_banned: boolean;
  is_subscribed: boolean;
  purchase_count: number;
  last_activity: string | null;
  created_at: string;
}

function Avatar({ name }: { name: string }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-gold-700/40', 'bg-purple-700/40', 'bg-emerald-700/40', 'bg-blue-700/40', 'bg-rose-700/40'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color} border border-white/10`}>
      <span className="text-silver-200 text-xs font-medium">{initials}</span>
    </div>
  );
}

export default function UtilisateursClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-charcoal border border-ash/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
        />
      </div>

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/50">
              {['Utilisateur', 'Email', 'Achats', 'Statut', 'Dernière activité', 'Inscrit le'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-b border-ash/20 hover:bg-charcoal/40 transition-colors cursor-pointer"
              >
                {/* Utilisateur */}
                <td className="px-4 py-3">
                  <Link href={`/admin/utilisateurs/${u.id}`} className="flex items-center gap-3">
                    <Avatar name={u.full_name} />
                    <div>
                      <p className="text-silver-300 text-sm hover:text-gold-400 transition-colors font-medium">
                        {u.full_name || 'Sans nom'}
                      </p>
                      {u.is_subscribed && (
                        <span className="flex items-center gap-1 text-purple-400 text-xs mt-0.5">
                          <Crown className="w-2.5 h-2.5" /> Abonné actif
                        </span>
                      )}
                    </div>
                  </Link>
                </td>

                {/* Email cliquable */}
                <td className="px-4 py-3">
                  <a
                    href={`mailto:${u.email}`}
                    className="text-silver-500 text-sm hover:text-gold-400 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    {u.email}
                  </a>
                </td>

                {/* Achats */}
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-sm font-medium ${u.purchase_count > 0 ? 'text-gold-400' : 'text-silver-600'}`}>
                    {u.purchase_count > 0 && <ShoppingBag className="w-3 h-3" />}
                    {u.purchase_count}
                  </span>
                </td>

                {/* Statut */}
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

                {/* Dernière activité */}
                <td className="px-4 py-3">
                  {u.last_activity ? (
                    <span className="flex items-center gap-1 text-silver-400 text-xs">
                      <BookOpen className="w-3 h-3 text-gold-600" />
                      {formatDate(u.last_activity)}
                    </span>
                  ) : (
                    <span className="text-silver-600 text-xs">Aucune</span>
                  )}
                </td>

                {/* Inscrit le */}
                <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-silver-500 text-sm">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-silver-600 text-xs text-right">{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
