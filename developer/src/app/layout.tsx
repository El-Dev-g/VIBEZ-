import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { DeveloperAuthProvider } from '../context/DeveloperAuthContext';

export const metadata: Metadata = {
  title: 'VIBEZ Developer Hub | Powered by PRIGID GROUP',
  description: 'Official API reference, WebSocket protocol guide, interactive API Explorer, Webhook simulator, and SDKs for the VIBEZ ecosystem.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        <DeveloperAuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </DeveloperAuthProvider>
      </body>
    </html>
  );
}

