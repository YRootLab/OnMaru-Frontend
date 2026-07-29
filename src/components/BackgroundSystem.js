/**
 * One Long Scroll 배경 그라데이션 시스템.
 *
 * 스크롤 진행도(0~1)를 시간대(새벽 → 아침 → 정오 → 오후 → 저녁)로 읽고,
 * 인접한 두 시간대의 그라데이션을 색상 보간해 document.body 배경에 그린다.
 *
 * 배경을 body에 그리는 이유:
 * html에 배경이 없으면 body의 배경은 루트 캔버스로 전파되어 음수 z-index 요소보다
 * 아래에 깔린다. 그래서 fixed 3D 캔버스(z-index: -1)를 투명하게 두면 이 그라데이션이
 * 그대로 비쳐 보인다. 3D는 그 위에 얹히는 레이어가 된다.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { updateLightForProgress } from './LightingSystem';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─────────────────────────────────────────
// 시간대별 그라데이션 정의 (tokens.ts 연동)
// ─────────────────────────────────────────

export const timeOfDay = {
  0.0: {
    name: '새벽',
    stops: [
      { position: 0, color: meok[100] },
      { position: 100, color: lightPalette.kobalt[50] },
    ],
  },

  0.25: {
    name: '아침',
    stops: [
      { position: 0, color: lightPalette.juhong[50] },
      { position: 100, color: surface.light.base },
    ],
  },

  0.5: {
    name: '정오',
    stops: [
      { position: 0, color: surface.light.base },
      { position: 100, color: surface.light.base },
    ],
  },

  0.75: {
    name: '오후',
    stops: [
      { position: 0, color: lightPalette.kobalt[50] },
      { position: 100, color: lightPalette.kobalt[50] },
    ],
  },

  1.0: {
    name: '저녁',
    stops: [
      { position: 0, color: lightPalette.kobalt[100] },
      { position: 100, color: lightPalette.kobalt[100] },
    ],
  },
};


/**
 * timeOfDay를 key 오름차순 배열로 펴둔다.
 * 객체 리터럴의 '0'과 '1'은 배열 인덱스로 취급돼 Object.keys가 앞으로 끌어올리므로,
 * 순회 순서를 그대로 믿으면 새벽 → 저녁 → 아침 순이 된다. 반드시 정렬해서 쓴다.
 */
const BANDS = Object.keys(timeOfDay)
  .map((key) => ({ at: Number(key), ...timeOfDay[key] }))
  .sort((a, b) => a.at - b.at);

// ─────────────────────────────────────────
// 1. lerpColor
// ─────────────────────────────────────────

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

function hexToRgb(hex) {
  const body = String(hex).replace('#', '');
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

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * 16진수 색상 두 개를 t(0~1)만큼 보간한다.
 * lerpColor('#FF0000', '#0000FF', 0.5) → '#7F007F'
 *
 * 소수점은 반올림이 아니라 내림으로 자른다(위 예시 기준). 최대 오차는 1/255라
 * 눈에 보이지 않고, 대신 결과가 항상 같은 규칙을 따른다.
 */
export function lerpColor(color1, color2, t) {
  const k = clamp01(t);
  const a = hexToRgb(color1);
  const b = hexToRgb(color2);

  return rgbToHex(
    Math.floor(a[0] + (b[0] - a[0]) * k),
    Math.floor(a[1] + (b[1] - a[1]) * k),
    Math.floor(a[2] + (b[2] - a[2]) * k)
  );
}

// ─────────────────────────────────────────
// 2. getGradientStopsForProgress
// ─────────────────────────────────────────

/** 한 시간대의 stops에서 임의 위치(0~100)의 색을 뽑는다. */
function sampleStopsAt(stops, position) {
  if (position <= stops[0].position) return stops[0].color;

  const last = stops[stops.length - 1];
  if (position >= last.position) return last.color;

  let i = 0;
  while (i < stops.length - 2 && position > stops[i + 1].position) i++;

  const a = stops[i];
  const b = stops[i + 1];
  const span = b.position - a.position;

  return lerpColor(a.color, b.color, span <= 0 ? 0 : (position - a.position) / span);
}

/**
 * 시간대마다 정지점 개수와 위치가 다를 수 있어 그냥 인덱스끼리 짝지어 보간할 수 없다.
 * 두 시간대의 position을 합집합으로 모은 뒤, 각 위치에서 양쪽 색을 샘플링해 보간한다.
 */
function unionPositions(stopsA, stopsB) {
  const set = new Set();
  for (const s of stopsA) set.add(s.position);
  for (const s of stopsB) set.add(s.position);
  return [...set].sort((x, y) => x - y);
}

/**
 * progress(0~1)에 해당하는 그라데이션 정지점 배열을 만든다.
 * 반환: [{ position, color }] — color가 두 시간대를 보간한 결과다.
 */
export function getGradientStopsForProgress(progress) {
  const p = clamp01(progress);

  let i = 0;
  while (i < BANDS.length - 2 && p > BANDS[i + 1].at) i++;

  const from = BANDS[i];
  const to = BANDS[i + 1];
  const span = to.at - from.at;
  const t = span <= 0 ? 0 : (p - from.at) / span;

  return unionPositions(from.stops, to.stops).map((position) => ({
    position,
    color: lerpColor(sampleStopsAt(from.stops, position), sampleStopsAt(to.stops, position), t),
  }));
}

/** 현재 progress가 어느 시간대 사이인지. 디버깅/오버레이용. */
export function getTimeOfDayName(progress) {
  const p = clamp01(progress);

  let i = 0;
  while (i < BANDS.length - 2 && p > BANDS[i + 1].at) i++;

  const span = BANDS[i + 1].at - BANDS[i].at;
  const t = span <= 0 ? 0 : (p - BANDS[i].at) / span;

  return t < 0.5 ? BANDS[i].name : BANDS[i + 1].name;
}

// ─────────────────────────────────────────
// 3. generateGradientCSS
// ─────────────────────────────────────────

/**
 * stops 배열을 CSS 문자열로 만든다.
 * "linear-gradient(180deg, #FF0000 0%, #7F007F 50%, #0000FF 100%)"
 */
export function generateGradientCSS(stops) {
  const parts = stops.map((s) => `${s.color} ${s.position}%`).join(', ');
  return `linear-gradient(180deg, ${parts})`;
}

// ─────────────────────────────────────────
// 4. updateBackgroundGradient
// ─────────────────────────────────────────

const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * 로그 최소 간격(ms).
 * scrub 갱신은 초당 60회라 그대로 흘리면 DevTools가 멈추고 다른 로그가 전부 묻힌다.
 * 스타일은 매 갱신마다 쓰고, 콘솔만 솎아낸다.
 */
const LOG_INTERVAL_MS = 100;

let lastCss = null;
let lastLogAt = 0;

/**
 * progress(0~1)에 맞춰 body 배경 그라데이션을 갱신한다.
 * 반환값은 실제로 적용된 CSS 문자열.
 */
export function updateBackgroundGradient(progress) {
  const stops = getGradientStopsForProgress(progress);
  const css = generateGradientCSS(stops);

  if (typeof document === 'undefined') return css;

  // 색이 1/255도 안 바뀐 프레임에서는 스타일을 다시 쓰지 않는다.
  if (css !== lastCss) {
    lastCss = css;
    document.body.style.background = css;

    // background 단축 속성은 background-attachment를 initial(scroll)로 되돌린다.
    // 다시 fixed로 못박지 않으면 그라데이션이 뷰포트가 아니라 문서 전체 높이(수백 vh)에
    // 걸쳐 늘어나 스크롤해도 거의 같은 색만 보인다.
    document.body.style.backgroundAttachment = 'fixed';
  }

  if (DEBUG) {
    const now = performance.now();
    if (now - lastLogAt >= LOG_INTERVAL_MS) {
      lastLogAt = now;
      console.log('Progress:', progress.toFixed(3), `(${getTimeOfDayName(progress)})`, css);
    }
  }

  return css;
}

// ─────────────────────────────────────────
// initBackgroundSystem
// ─────────────────────────────────────────

/**
 * 스크롤 갱신 한 번에 딸려가는 일들.
 * 배경과 조명은 같은 시간대 곡선을 공유하므로 반드시 같은 progress 값으로,
 * 같은 프레임에 갱신되어야 한다. 따로 구독하면 scrub 지연만큼 어긋난다.
 */
function handleProgress(progress) {
  updateBackgroundGradient(progress);
  updateLightForProgress(progress);
}

/**
 * 배경 + 조명 시스템을 스크롤에 연결한다. 정리 함수를 반환한다.
 *
 * @param {object}   [options]
 * @param {Function} [options.subscribe]
 *   이미 페이지 전체를 덮는 ScrollTrigger가 있다면 그 진행도 구독 함수를 넘긴다.
 *   (subscribe(listener) → unsubscribe) 넘기지 않으면 이 모듈이 document.body에
 *   자체 ScrollTrigger를 만든다.
 */
export function initBackgroundSystem({ subscribe } = {}) {
  if (typeof window === 'undefined') return () => {};

  // 첫 프레임부터 올바른 색/밝기로 시작한다.
  handleProgress(0);

  if (subscribe) {
    return subscribe(handleProgress);
  }

  // ScrollTrigger 단독의 self.progress는 scrub의 관성을 타지 않고 스크롤 위치를
  // 그대로 따라간다. scrub: 1의 부드러움을 배경에 실으려면 프록시 값을 애니메이션시켜야 한다.
  const proxy = { p: 0 };

  const tween = gsap.to(proxy, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
    onUpdate: () => handleProgress(proxy.p),
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

export default initBackgroundSystem;
