/**
 * 카카오맵 웹 길찾기 URL 및 카카오내비 앱 스킴 생성 유틸리티
 */
export interface NavigationLinks {
  webUrl: string;
  appScheme: string;
}

export function createKakaoNavigationLinks(
  title: string,
  lat: number,
  lng: number,
): NavigationLinks {
  const safeName = encodeURIComponent(title || '목적지');
  const validLat = Number.isFinite(lat) ? lat : 0;
  const validLng = Number.isFinite(lng) ? lng : 0;

  return {
    // 카카오맵 웹 길찾기: https://map.kakao.com/link/to/이름,위도,경도
    webUrl: `https://map.kakao.com/link/to/${safeName},${validLat},${validLng}`,
    // 카카오내비 앱 스킴
    appScheme: `kakaonavi://navigate?name=${safeName}&x=${validLng}&y=${validLat}`,
  };
}
