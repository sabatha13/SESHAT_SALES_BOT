import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-void relative">
      <div className="absolute inset-0 bg-glow-gold pointer-events-none" />
      <header className="relative z-10 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 rounded-lg bg-gold-gradient flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-void" />
          </div>
          <span className="font-serif text-base gold-text">CDS Librairie Ésotérique</span>
        </Link>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
