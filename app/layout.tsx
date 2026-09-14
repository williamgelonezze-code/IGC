import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthModal from '@/components/AuthModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Painel CPA/M-7',
  description: 'Painel de Análise Situacional e Gestão Corporativa do CPA/M-7',
  openGraph: {
    title: 'Painel CPA/M-7',
    description: 'Painel de Análise Situacional e Gestão Corporativa do CPA/M-7',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`} suppressHydrationWarning>
        <AuthModal />
        {children}
      </body>
    </html>
  );
}
