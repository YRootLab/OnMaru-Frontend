/**
 * node src/utils/solar.check.mjs
 *
 * 고도↔계절값 변환과 절기 표가 깨지면 여기서 먼저 터진다.
 */
import assert from 'node:assert/strict';

import SHADOW from '../data/solarShadow.json' with { type: 'json' };
const TERMS = SHADOW.stops;
import {
  altitudeToSeasonValue,
  getNoonSolarAltitude,
  seasonValueToAltitude,
  shadowLengthRatio,
  solarTermDate,
} from './solar.js';

const SEOUL = 37.5665;

// 하지 정오 고도는 최대, 동지는 최소 — 서울에서 76° / 29°.
const haji = getNoonSolarAltitude(SEOUL, new Date(2026, 5, 21));
const dongji = getNoonSolarAltitude(SEOUL, new Date(2026, 11, 21));

assert.ok(haji > 75 && haji < 77, `서울 하지 고도 ${haji}`);
assert.ok(dongji > 28 && dongji < 30, `서울 동지 고도 ${dongji}`);
assert.ok(altitudeToSeasonValue(haji, SEOUL) < 0.02, '하지가 0 근처가 아니다');
assert.ok(altitudeToSeasonValue(dongji, SEOUL) > 0.98, '동지가 1 근처가 아니다');

// 범위 밖은 잘리고, 두 변환은 서로의 역이다.
assert.equal(altitudeToSeasonValue(999, SEOUL), 0);
assert.equal(altitudeToSeasonValue(-999, SEOUL), 1);

for (const v of [0, 0.25, 0.5, 0.78, 1]) {
  const back = altitudeToSeasonValue(seasonValueToAltitude(v, SEOUL), SEOUL);
  assert.ok(Math.abs(back - v) < 1e-9, `왕복 실패 ${v} → ${back}`);
}

// 절기 표 — 24개, id 중복 없음, 날짜가 실제로 잡힌다.
assert.equal(TERMS.length, 24, '절기가 24개가 아니다');
assert.equal(new Set(TERMS.map((t) => t.id)).size, 24, 'id가 겹친다');

for (const term of TERMS) {
  const date = solarTermDate(term, 2026);
  assert.equal(date.getMonth() + 1, term.month, `${term.name} 달이 어긋난다`);
  assert.equal(date.getDate(), term.day, `${term.name} 날짜가 어긋난다`);
  assert.ok(term.copy?.length > 0, `${term.name} copy가 비었다`);
}

// 하지/동지 절기가 계절값 양 끝에 선다.
const at = (id) => {
  const term = TERMS.find((t) => t.id === id);
  return altitudeToSeasonValue(getNoonSolarAltitude(SEOUL, solarTermDate(term, 2026)), SEOUL);
};

assert.ok(at('haji') < 0.02, '하지 절기가 0 근처가 아니다');
assert.ok(at('dongji') > 0.98, '동지 절기가 1 근처가 아니다');
assert.ok(Math.abs(at('chunbun') - 0.5) < 0.05, '춘분이 한가운데가 아니다');

// ── 절기 그림자 표 (서울 계동 37.58°N)
//
// 표에 적힌 고도와 그림자가 서로 맞는지, 그리고 고도가 위도에서 실제로 나오는지 본다.
// 손으로 옮겨 적은 숫자라 한 칸만 어긋나도 화면의 모든 문장이 같이 틀어진다.

assert.equal(SHADOW.stops.length, 8, '절기가 8개가 아니다');
assert.equal(new Set(SHADOW.stops.map((s) => s.id)).size, 8, 'id가 겹친다');

const byId = new Map(SHADOW.stops.map((s) => [s.id, s]));

for (const stop of SHADOW.stops) {
  const expected = shadowLengthRatio(stop.altitude) * 100;
  assert.ok(
    Math.abs(expected - stop.shadow) < 0.6,
    `${stop.name} 그림자 ${stop.shadow}cm — 고도 ${stop.altitude}°에서는 ${expected.toFixed(1)}cm`,
  );

  // cm와 배수는 같은 값을 두 번 적은 것이다. 한쪽만 고치면 화면에서 어긋난다.
  assert.ok(
    Math.abs(stop.shadowRatio - stop.shadow / 100) < 0.01,
    `${stop.name} shadowRatio ${stop.shadowRatio} ≠ ${stop.shadow}cm`,
  );

  // 화면이 통째로 이 세 문장으로 돌아간다. 비면 빈 화면이 된다.
  for (const key of ['headline', 'note', 'sunlightReach']) {
    assert.ok(stop[key]?.length > 0, `${stop.name} ${key}가 비었다`);
  }

  // 짝 절기는 서로를 가리키고 고도가 같아야 한다 (춘분↔추분, 입춘↔입동, 입하↔입추).
  if (stop.pairId) {
    const pair = byId.get(stop.pairId);
    assert.ok(pair, `${stop.name}의 짝 ${stop.pairId}이 없다`);
    assert.equal(pair.pairId, stop.id, `${stop.name}↔${pair.name} 짝이 서로를 가리키지 않는다`);
    assert.equal(pair.altitude, stop.altitude, `${stop.name}↔${pair.name} 고도가 다르다`);
  }

  const altitude = getNoonSolarAltitude(SHADOW.latitude, solarTermDate(stop, 2026));
  assert.ok(
    Math.abs(altitude - stop.altitude) < 1.2,
    `${stop.name} 고도 ${stop.altitude}° — 날짜로 계산하면 ${altitude.toFixed(2)}°`,
  );
}

// 하지가 가장 짧고 동지가 가장 길다. 이 순서가 뒤집히면 연출이 통째로 거꾸로 간다.
const shadows = SHADOW.stops.map((s) => s.shadow);
assert.equal(Math.min(...shadows), 25.2, '가장 짧은 그림자가 하지가 아니다');
assert.equal(Math.max(...shadows), 180.2, '가장 긴 그림자가 동지가 아니다');

console.log('solar.js ok');
