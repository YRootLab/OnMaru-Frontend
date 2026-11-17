'use client';

import { useServerInsertedHTML } from 'next/navigation';

export function ThemeModeScript({ nonce }: { nonce: string }) {
  useServerInsertedHTML(() => (
    <script
      id="theme-mode-init"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=localStorage.getItem('onmaru-color-mode');var h=new Date().getHours();var t=h>=7&&h<19?'light':'dark';var m=(s==='dark'||s==='light')?s:t;document.documentElement.setAttribute('data-theme',m);}catch(e){}})();`,
      }}
    />
  ));

  return null;
}
