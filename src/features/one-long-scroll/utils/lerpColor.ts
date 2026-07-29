/** 0 ~ 255 범위의 sRGB 3요소. */
export type Rgb = [number, number, number];

export interface ColorStop {
  /** 0 ~ 1 구간 위의 위치 */
  at: number;
  color: Rgb;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function hexToRgb(hex: string): Rgb {
  const body = hex.replace('#', '');
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body;

  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToCss([r, g, b]: Rgb): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * 두 색을 선형 보간한다.
 * out을 넘기면 새 배열을 만들지 않는다 — 매 프레임 돌아가는 경로에서 GC를 태우지 않기 위한 것.
 */
export function lerpColor(from: Rgb, to: Rgb, t: number, out: Rgb = [0, 0, 0]): Rgb {
  const k = clamp01(t);

  out[0] = from[0] + (to[0] - from[0]) * k;
  out[1] = from[1] + (to[1] - from[1]) * k;
  out[2] = from[2] + (to[2] - from[2]) * k;

  return out;
}

/**
 * 여러 색 정지점 위에서 progress에 해당하는 색을 뽑는다.
 * stops는 at 오름차순이어야 하고 최소 2개가 필요하다.
 */
export function sampleColorStops(stops: ColorStop[], progress: number, out: Rgb = [0, 0, 0]): Rgb {
  const p = clamp01(progress);

  let i = 0;
  while (i < stops.length - 2 && p > stops[i + 1].at) i++;

  const a = stops[i];
  const b = stops[i + 1];
  const span = b.at - a.at;

  return lerpColor(a.color, b.color, span <= 0 ? 0 : (p - a.at) / span, out);
}
