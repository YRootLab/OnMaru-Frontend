import type { Metadata } from 'next'
import Script from 'next/script'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Providers } from './providers'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import PageContainer from '@/shared/components/Layout/PageContainer'

export const metadata: Metadata = {
  title: '온마루 — 한옥의 온기를 잇다',
  description: '전국 한옥의 온기와 이야기를 연결하는 플랫폼',
  icons: {
    icon: '/favicon.ico',
  },
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
                  var hour = new Date().getHours();
                  var timeMode = hour >= 7 && hour < 19 ? 'light' : 'dark';
                  var mode = (saved === 'dark' || saved === 'light') ? saved : timeMode;
                  document.documentElement.setAttribute('data-theme', mode);
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="kakao-maps-sdk"
          strategy="afterInteractive"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`}
        />
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            src={`https://www.clarity.ms/tag/${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}`}
          />
        )}
      </head>
      <body>
        <Providers>
          <Header />
          <PageContainer>
            {children}
          </PageContainer>
          <Footer />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  )
}
