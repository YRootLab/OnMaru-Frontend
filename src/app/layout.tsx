import type { Metadata } from 'next'
// Lenis 필수 스타일시트. html.lenis 클래스에 걸리는 규칙들(height 해제, lenis-stopped 등)이
// 없으면 스크롤 상태 전환이 어긋난다. Next App Router에서 전역 CSS는 layout에서만 import 가능.
import 'lenis/dist/lenis.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: '온마루 — 한옥의 온기를 잇다',
  description: '전국 한옥의 온기와 이야기를 연결하는 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
