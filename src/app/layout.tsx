import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import Header from '@/shared/components/Header'
import PageContainer from '@/shared/components/Layout/PageContainer'

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
      <head>
        <Script
          id="onmaru-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('onmaru-color-mode');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var mode = (saved === 'dark' || saved === 'light') ? saved : (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', mode);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <Header />
          <PageContainer>
            {children}
          </PageContainer>
        </Providers>
      </body>
    </html>
  )
}
