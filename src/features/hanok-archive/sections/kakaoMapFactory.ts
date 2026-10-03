interface KakaoMapNamespace<TMap> {
  Map: new (container: HTMLElement, options: unknown) => TMap;
  [key: string]: unknown;
}

interface KakaoBoundsMap {
  getLevel(): number;
  setBounds(bounds: unknown, ...padding: number[]): void;
  setLevel(level: number, options: { animate: boolean }): void;
}

export const KAKAO_CLUSTER_STYLES = [
  {
    width: '46px',
    height: '46px',
    background: 'rgba(255, 255, 255, 0.94)',
    border: '1.5px solid #FF5500',
    borderRadius: '50%',
    color: '#D94000',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 'normal',
    fontWeight: '500',
    fontSize: '13px',
    boxShadow: 'none',
    fontFamily: 'var(--font-hanok)',
  },
  {
    width: '54px',
    height: '54px',
    background: 'linear-gradient(135deg, #FF5500 0%, #D94000 100%)',
    border: '2px solid #ffffff',
    borderRadius: '50%',
    color: '#ffffff',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 'normal',
    fontWeight: '500',
    fontSize: '14px',
    boxShadow: 'none',
    fontFamily: 'var(--font-hanok)',
  },
] as const;

export function createKakaoMap<TMap>(
  maps: KakaoMapNamespace<TMap>,
  container: HTMLElement,
  options: unknown,
): TMap {
  return new maps.Map(container, options);
}

export function fitKakaoMapBounds(
  map: KakaoBoundsMap,
  bounds: unknown,
  zoomInSteps = 0,
): void {
  map.setBounds(bounds, 32, 32, 32, 32);
  if (zoomInSteps <= 0) return;

  map.setLevel(Math.max(1, map.getLevel() - zoomInSteps), { animate: false });
}
