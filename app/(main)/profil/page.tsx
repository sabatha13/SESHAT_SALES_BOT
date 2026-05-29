import { UserProfile } from '@clerk/nextjs';

export default function ProfilPage() {
  return (
    <div className="min-h-screen py-16 px-4 flex justify-center">
      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full max-w-2xl',
            card: 'bg-obsidian border border-ash/50 shadow-card rounded-2xl',
            headerTitle: 'font-serif text-silver-200',
            headerSubtitle: 'text-silver-500',
            formButtonPrimary: 'bg-gold-600 hover:bg-gold-500 text-void',
          },
        }}
      />
    </div>
  );
}
