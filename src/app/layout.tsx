import './globals.css';
import { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/shared/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'PWA Fitness - Personal & Aluno',
  description: 'Plataforma completa para personal trainers gerenciarem alunos, treinos, progresso e gamificação com offline-first',
  manifest: '/manifest.json',
  themeColor: '#00D9FF',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fitness Pro',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <meta name="theme-color" content="#00D9FF" />
        <meta name="msapplication-TileColor" content="#00D9FF" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="min-h-screen bg-bg-dark text-text-primary">
            {children}
          </main>
          <OfflineIndicator />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}