import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

async function isAdmin(clerkUserId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_user_id', clerkUserId)
    .single();
  return data?.is_admin === true;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const admin = await isAdmin(userId);
  if (!admin) redirect('/');

  return (
    <div className="min-h-screen flex bg-void">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">{children}</main>
    </div>
  );
}
