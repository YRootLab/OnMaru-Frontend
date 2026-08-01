/**
 * node src/utils/solar.check.mjs
 *
 * 고도↔계절값 변환과 절기 표가 깨지면 여기서 먼저 터진다.
 */
import assert from 'node:assert/strict';

import TERMS from '../data/solarTerms.json' with { type: 'json' };
import {
  altitudeToSeasonValue,
  getNoonSolarAltitude,
  seasonValueToAltitude,
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

console.log('solar.js ok');
