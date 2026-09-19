import { gsap } from 'gsap';
import type { KakaoMap } from '@/features/map/types';

export interface OverlaySpec {
  lat: number;
  lng: number;
  el: HTMLElement;
  zIndex?: number;
  yAnchor?: number;
}

/*
  온기 뱃지·쪽지(WarmthLayer, WarmthNotesLayer)는 el 자체가 :hover로 transform을
  건다(예: .om-surge-pill-wrap:hover { transform: scale(1.06) }). GSAP이 같은
  엘리먼트의 transform을 건드리면 그 CSS 상태를 덮어써 버리므로, 등장 애니메이션은
  별도 wrapper의 scale/opacity에만 건다 — PlaceMarkers.tsx의 burstIn과 같은 이유,
  같은 패턴이다. paintOverlays 하나만 고치면 이 함수를 쓰는 모든 레이어가 같이
  부드러워진다.
*/
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

/**
 * CustomOverlay 묶음을 지도에 올리고, 걷어내는 함수를 돌려준다.
 * 레이어 컴포넌트의 useEffect cleanup에 그대로 물리면 된다.
 * 새로 올라가는 오버레이는 은은한 팝인으로 등장한다(줌/필터가 바뀔 때 뚝 끊기지 않도록).
 */
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
