'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  // Suppress React 19 "Encountered a script tag" warning
  // This is a known issue with next-themes and React 19/Next 15
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
        return;
      }
      orig.apply(console, args);
    };
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
