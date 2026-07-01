import { assertVceAdmin } from '@/lib/vce-admin';
import AdminSidebar from './_components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await assertVceAdmin();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--n)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, minWidth: 0, background: 'var(--n)' }}>{children}</main>
    </div>
  );
}
