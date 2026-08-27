import './globals.css'
import React from 'react'
import { LanguageProvider } from '@/lib/LanguageContext'

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
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
