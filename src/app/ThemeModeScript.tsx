'use client';

import { useServerInsertedHTML } from 'next/navigation';

export function ThemeModeScript({ nonce }: { nonce: string }) {
  useServerInsertedHTML(() => (
    <script
      id="theme-mode-init"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=localStorage.getItem('onmaru-color-mode');var h=new Date().getHours();var t=h>=7&&h<19?'light':'dark';var m=(s==='dark'||s==='light')?s:t;document.documentElement.setAttribute('data-theme',m);}catch(e){}try{if(typeof CSSStyleDeclaration!=='undefined'){var p=CSSStyleDeclaration.prototype;var o=p.setProperty;p.setProperty=function(n,v,r){if((n==='user-select'||n==='-webkit-user-select')&&v==='auto')return;return o.call(this,n,v,r);};var d=Object.getOwnPropertyDescriptor(p,'userSelect');if(d&&d.set){var s=d.set;Object.defineProperty(p,'userSelect',{set:function(v){if(v==='auto')return;return s.call(this,v);},get:d.get,configurable:true,enumerable:true});}var wd=Object.getOwnPropertyDescriptor(p,'webkitUserSelect');if(wd&&wd.set){var ws=wd.set;Object.defineProperty(p,'webkitUserSelect',{set:function(v){if(v==='auto')return;return ws.call(this,v);},get:wd.get,configurable:true,enumerable:true});}}}catch(e){}})();`,
      }}
    />
  ));

  return null;
}
