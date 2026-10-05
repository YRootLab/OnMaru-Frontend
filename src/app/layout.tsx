import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Providers } from './providers'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import PageContainer from '@/shared/components/Layout/PageContainer'

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: '온마루 — 한옥의 온기를 잇다',
  description: '전국 한옥의 온기와 이야기를 연결하는 플랫폼',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Script
          id="theme-mode-init"
          nonce={nonce}
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('onmaru-color-mode');var h=new Date().getHours();var t=h>=7&&h<19?'light':'dark';var m=(s==='dark'||s==='light')?s:t;document.documentElement.setAttribute('data-theme',m);}catch(e){}})();`,
          }}
        />
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          nonce={nonce}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.nonce=(d.currentScript&&d.currentScript.nonce)||(f&&f.nonce)||'';
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NRM4H9L7');`,
          }}
        />
        {/* End Google Tag Manager */}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script
            id="microsoft-clarity"
            nonce={nonce}
            strategy="afterInteractive"
            data-clarity-project-id={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,t,y){var cs=document.currentScript;var i=cs&&cs.getAttribute('data-clarity-project-id');if(!i){return;}c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script");`,
            }}
          />
        )}
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NRM4H9L7"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          <Header />
          <PageContainer>
            {children}
          </PageContainer>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  )
}
