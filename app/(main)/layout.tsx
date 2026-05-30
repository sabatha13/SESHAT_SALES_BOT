import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PromoBanner from '@/components/layout/PromoBanner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PromoBanner />
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <Footer />
    </div>
  );
}
