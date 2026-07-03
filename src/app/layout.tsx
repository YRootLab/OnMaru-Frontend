import type { Metadata } from 'next'
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
