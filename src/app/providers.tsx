'use client'

import { OnmaruThemeProvider } from '@/design-system/ThemeProvider'
import { EmotionRegistry } from '@/design-system/EmotionRegistry'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <OnmaruThemeProvider defaultMode="light" followSystem>
        {children}
      </OnmaruThemeProvider>
    </EmotionRegistry>
  )
}
