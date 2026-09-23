import { gsap } from 'gsap';
import type { KakaoMap } from '@/features/map/types';

export interface OverlaySpec {
  lat: number;
  lng: number;
  el: HTMLElement;
  zIndex?: number;
  yAnchor?: number;
}









function wrapForEntrance(el: HTMLElement, transformOrigin: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'inline-block';
  wrapper.style.transformOrigin = transformOrigin;
  wrapper.appendChild(el);
  return wrapper;
}

function burstIn(wrappers: HTMLDivElement[]): void {
  if (wrappers.length === 0) return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(wrappers, { scale: 1, opacity: 1 });
    return;
  }
  gsap.fromTo(
    wrappers,
    { scale: 0.5, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.45,
      ease: 'back.out(1.5)',
      stagger: { amount: Math.min(0.3, wrappers.length * 0.015), from: 'center' },
      overwrite: true,
    },
  );
}






export function paintOverlays(map: KakaoMap, specs: OverlaySpec[]): () => void {
  const wrappers: HTMLDivElement[] = [];

  const overlays = specs.map(({ lat, lng, el, zIndex = 1, yAnchor = 1 }) => {
    const wrapper = wrapForEntrance(el, yAnchor >= 1 ? 'center bottom' : 'center center');
    wrappers.push(wrapper);

    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(lat, lng),
      content: wrapper,
      yAnchor,
      zIndex,
    });
    (el as any).__kakaoOverlay = overlay;
    overlay.setMap(map);
    return overlay;
  });

  burstIn(wrappers);

  return () => overlays.forEach((o) => o.setMap(null));
}
