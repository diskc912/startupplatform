'use client'

import { usePathname } from 'next/navigation'

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMessages = pathname?.startsWith('/messages')
  
  if (isMessages) {
    return <main className="flex-1 w-full h-full">{children}</main>
  }
  
  return <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full">{children}</main>
}
