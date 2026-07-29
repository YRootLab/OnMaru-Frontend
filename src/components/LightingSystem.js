/**
 * One Long Scroll 조명 시스템.
 *
 * BackgroundSystem과 같은 패턴 — 스크롤 진행도(0~1)를 곡선으로 읽어
 * 주광(directionalLight)의 세기와 색을 갱신한다. 배경 그라데이션의 시간대
 * (새벽 → 아침 → 정오 → 오후 → 저녁)와 같은 리듬을 타도록 정지점을 맞췄다.
 *
 * three나 R3F에 의존하지 않는다. 캔버스 쪽에서 조명 인스턴스를 registerKeyLight로
 * 넘겨주면, 이 모듈은 그 객체의 intensity/color만 건드린다.
 */

import { lightPalette } from '@/design-system/tokens';
import { lerpColor } from './BackgroundSystem';

// ─────────────────────────────────────────
// 곡선 정의
// ─────────────────────────────────────────

/** 세기 곡선. 정오(0.5)에 가장 강하고 새벽/저녁 양 끝이 가장 어둡다. */
export const INTENSITY_CURVE = [
  { at: 0.0, value: 0.3 },
  { at: 0.25, value: 1.2 },
  { at: 0.5, value: 2.8 },
  { at: 0.75, value: 1.2 },
  { at: 1.0, value: 0.3 },
];

/** 색 곡선. 주홍 → 황금 → 백색 → 코발트 순으로 하루를 돈다. */
export const COLOR_CURVE = [
  { at: 0.0, color: lightPalette.juhong[500] }, // #E85A18 단청 주홍
  { at: 0.25, color: lightPalette.hwanggeum[400] }, // #F5A623 황금 기와
  { at: 0.5, color: '#FFFFFF' }, // 정오 백색광
  { at: 0.75, color: lightPalette.kobalt[400] }, // #4068E8 청화 코발트
  { at: 1.0, color: lightPalette.kobalt[500] }, // #2B5CE6 청화 코발트(짙은 쪽)
];

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * 곡선 위에서 progress를 감싸는 두 정지점과 그 사이 비율을 찾는다.
 * 곡선은 at 오름차순이어야 하고 최소 2개가 필요하다.
 */
function bracket(curve, progress) {
  const p = clamp01(progress);

  let i = 0;
  while (i < curve.length - 2 && p > curve[i + 1].at) i++;

  const from = curve[i];
  const to = curve[i + 1];
  const span = to.at - from.at;

  return { from, to, t: span <= 0 ? 0 : (p - from.at) / span };
}

// ─────────────────────────────────────────
// 보간
// ─────────────────────────────────────────

/** 세기 곡선을 선형 보간해 intensity를 구한다. */
export function lerpIntensity(curve, progress) {
  const { from, to, t } = bracket(curve, progress);
  return from.value + (to.value - from.value) * t;
}

/**
 * 색 곡선을 보간해 THREE.Color.setHex()에 넣을 수 있는 숫자(0xRRGGBB)를 반환한다.
 * 색 계산 자체는 BackgroundSystem의 lerpColor를 그대로 쓴다 — 규칙이 갈리면
 * 배경과 조명의 색이 미묘하게 어긋난다.
 */
export function lerpLightColor(curve, progress) {
  const { from, to, t } = bracket(curve, progress);
  return parseInt(lerpColor(from.color, to.color, t).slice(1), 16);
}

// ─────────────────────────────────────────
// 조명 등록 / 갱신
// ─────────────────────────────────────────

const DEBUG = process.env.NODE_ENV !== 'production';
const LOG_INTERVAL_MS = 100;

let keyLight = null;
let lastProgress = 0;
let lastLogAt = 0;

/**
 * 주광 인스턴스를 등록한다. 등록 해제 함수를 반환한다.
 *
 * 캔버스는 스크롤 시스템보다 늦게(dynamic import + Suspense) 올라오므로,
 * 등록 시점에 마지막 progress를 즉시 한 번 반영해 첫 프레임부터 어긋나지 않게 한다.
 */
export function registerKeyLight(light) {
  keyLight = light ?? null;
  if (keyLight) updateLightForProgress(lastProgress);

  return () => {
    if (keyLight === light) keyLight = null;
  };
}

/**
 * progress(0~1)에 맞춰 주광을 갱신한다.
 * 조명이 아직 등록되지 않았어도 진행도는 기억해둔다.
 */
export function updateLightForProgress(progress) {
  lastProgress = clamp01(progress);

  const intensity = lerpIntensity(INTENSITY_CURVE, lastProgress);
  const colorHex = lerpLightColor(COLOR_CURVE, lastProgress);

  if (keyLight) {
    keyLight.intensity = intensity;
    keyLight.color.setHex(colorHex);
  }

  if (DEBUG) {
    const now = performance.now();
    if (now - lastLogAt >= LOG_INTERVAL_MS) {
      lastLogAt = now;
      console.log(
        'Light:',
        `intensity=${intensity.toFixed(2)}`,
        `color=#${colorHex.toString(16).padStart(6, '0').toUpperCase()}`
      );
    }
  }

  return { intensity, colorHex };
}

export default updateLightForProgress;
