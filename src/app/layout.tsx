import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import PixelBlastBackground from '@/components/layout/PixelBlastBackground'
import ClickSpark from '@/components/ui/ClickSpark'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'DevHub', template: '%s — DevHub' },
  description: 'Collaborate. Track. Ship. Multi-user project collaboration and progress tracking platform.',
  keywords: ['devhub', 'project management', 'github', 'collaboration', 'feature tracking'],
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <PixelBlastBackground />
          <ClickSpark sparkColor="#58a6ff" sparkCount={10} sparkRadius={25} sparkSize={12}>
            {children}
          </ClickSpark>
        </SessionProvider>
      </body>
    </html>
  )
}
