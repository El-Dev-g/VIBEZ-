import './globals.css'
import React from 'react'
import { LanguageProvider } from '@/lib/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'VIBEZ - Secure, Next-Gen Communication Suite',
  description: 'Experience real-time instant messaging with state-of-the-art security, dual-identity registration, and a stunning admin panel.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased bg-[#0b141a]">
        <LanguageProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}
