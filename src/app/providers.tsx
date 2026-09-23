'use client'

import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { OnmaruThemeProvider, useOnmaruTheme } from '@/design-system/ThemeProvider'
import { EmotionRegistry } from '@/design-system/EmotionRegistry'
import { useAuthReturn } from '@/features/auth/hooks/useAuthReturn'

function ThemedToaster() {
  const { mode } = useOnmaruTheme()
  return <Toaster theme={mode} position="top-center" richColors closeButton />
}

/*
  카카오 로그인 복귀 감지 — 모든 페이지에서 `{returnTo}?auth=success|failed`를
  파싱한다(가이드 §1-2). useSearchParams는 정적 렌더 시 Suspense 경계가 필요하다.
*/
function AuthReturnHandler() {
  useAuthReturn()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <OnmaruThemeProvider defaultMode="system">
        <Suspense fallback={null}>
          <AuthReturnHandler />
        </Suspense>
        {children}
        <ThemedToaster />
      </OnmaruThemeProvider>
    </EmotionRegistry>
  )
}
