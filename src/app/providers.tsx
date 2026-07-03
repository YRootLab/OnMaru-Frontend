'use client'

import { OnmaruThemeProvider } from '@/design-system/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OnmaruThemeProvider defaultMode="light" followSystem>
      {children}
    </OnmaruThemeProvider>
  )
}
