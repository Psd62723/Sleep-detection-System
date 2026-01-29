import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  );
}
