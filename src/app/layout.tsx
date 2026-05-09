import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import StreamProvider from '@/components/StreamProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { MainWrapper } from '@/components/MainWrapper'
import FloatingChatButton from '@/components/FloatingChatButton'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Founder Ideas',
  description:
    'A minimalist platform for founders to share startup ideas, discuss, and connect.',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body 
        className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white font-sans antialiased transition-colors"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light">
          <StreamProvider>
            <Navbar />
            <FloatingChatButton />
            <MainWrapper>{children}</MainWrapper>
          </StreamProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
