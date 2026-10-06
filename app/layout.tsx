import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/public/lib/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prof Monday Night',
  description: 'Prossima partita e formazioni',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${inter.className} bg-slate-50 text-slate-800 min-h-screen antialiased`}>
        <Navbar>
          <main className="flex-1 max-w-md w-full mx-auto p-4">{children}</main>
        </Navbar>
      </body>
    </html>
  );
}