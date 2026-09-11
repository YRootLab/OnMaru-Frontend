import type { KakaoMap } from '@/features/map/types';

export interface OverlaySpec {
  lat: number;
  lng: number;
  el: HTMLElement;
  zIndex?: number;
  yAnchor?: number;
}

/**
 * CustomOverlay 묶음을 지도에 올리고, 걷어내는 함수를 돌려준다.
 * 레이어 컴포넌트의 useEffect cleanup에 그대로 물리면 된다.
 */
export function paintOverlays(map: KakaoMap, specs: OverlaySpec[]): () => void {
  const overlays = specs.map(({ lat, lng, el, zIndex = 1, yAnchor = 1 }) => {
    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(lat, lng),
      content: el,
      yAnchor,
      zIndex,
    });
    (el as any).__kakaoOverlay = overlay;
    overlay.setMap(map);
    return overlay;
  });

  return () => overlays.forEach((o) => o.setMap(null));
}
