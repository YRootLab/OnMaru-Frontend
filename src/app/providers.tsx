'use client'

import { Toaster } from 'sonner'
import { OnmaruThemeProvider, useOnmaruTheme } from '@/design-system/ThemeProvider'
import { EmotionRegistry } from '@/design-system/EmotionRegistry'

function ThemedToaster() {
  const { mode } = useOnmaruTheme()
  return <Toaster theme={mode} position="top-center" richColors closeButton />
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <OnmaruThemeProvider defaultMode="system">
        {children}
        <ThemedToaster />
      </OnmaruThemeProvider>
    </EmotionRegistry>
  )
}
