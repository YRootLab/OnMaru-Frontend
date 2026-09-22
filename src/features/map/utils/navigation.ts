


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

    webUrl: `https://map.kakao.com/link/to/${safeName},${validLat},${validLng}`,

    appScheme: `kakaonavi://navigate?name=${safeName}&x=${validLng}&y=${validLat}`,
  };
}
