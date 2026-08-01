/**
 * 볕의 계산.
 *
 * 태양 적위 → 정오 고도 → 계절값(0 하지 ~ 1 동지)이 한 줄로 이어진다.
 * 적위는 Cooper 식(오차 ±0.5°)이라 눈으로 보는 연출에는 남는다.
 */

const RAD = Math.PI / 180;

/** 축분점 기울기. 하지·동지의 적위이자 고도 진폭의 반이다. */
export const OBLIQUITY = 23.44;

export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

/** 태양 적위 (degrees) */
export function getSolarDeclination(date = new Date()) {
  const n = getDayOfYear(date);
  return OBLIQUITY * Math.sin((360 / 365) * (n + 284) * RAD);
}

/** 정오 태양 고도 (degrees) */
export function getNoonSolarAltitude(latitude, date = new Date()) {
  return 90 - latitude + getSolarDeclination(date);
}

/**
 * 태양 고도를 seasonValue(0~1)로 변환.
 * 0 = 하지(고도 최대), 1 = 동지(고도 최소)
 */
export function altitudeToSeasonValue(altitude, latitude) {
  const maxAlt = 90 - latitude + OBLIQUITY;
  const minAlt = 90 - latitude - OBLIQUITY;
  const v = (maxAlt - altitude) / (maxAlt - minAlt);
  return Math.min(1, Math.max(0, v));
}

/** 위 변환의 역. 슬라이더가 선 자리의 고도를 그대로 읽어줄 때 쓴다. */
export function seasonValueToAltitude(seasonValue, latitude) {
  return 90 - latitude + OBLIQUITY - seasonValue * 2 * OBLIQUITY;
}

/**
 * 그림자가 물체 높이의 몇 배로 뻗는지.
 *
 * 계동(37.58°N) 하지 75.82°면 0.252배, 동지 29.02°면 1.802배.
 * 고도가 0에 가까우면 발산하므로 지평선 언저리는 잘라둔다.
 */
export function shadowLengthRatio(altitude) {
  return 1 / Math.tan(Math.max(altitude, 1) * RAD);
}

/**
 * 절기(solarShadow.json의 month/day)가 올해 드는 날.
 *
 * 실제 절기는 해마다 하루 남짓 흔들리지만, 그 하루가 적위에 주는 차이는 0.4° 미만이라
 * 처마 그림자로는 보이지 않는다. 표의 날짜를 그대로 쓴다.
 */
export function solarTermDate(term, year = new Date().getFullYear()) {
  return new Date(year, term.month - 1, term.day);
}
