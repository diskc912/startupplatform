'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-8 h-6 inline-block" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
      className="text-xs font-medium px-4 py-1 border transition-colors shadow-sm"
      style={{
        borderColor: isDark ? 'var(--foreground)' : 'var(--border)',
        color: 'var(--foreground)',
        backgroundColor: 'transparent',
        borderRadius: '9999px',
      }}
    >
      {isDark ? '☀ Light' : '☾ Dark'}
    </button>
  )
}
