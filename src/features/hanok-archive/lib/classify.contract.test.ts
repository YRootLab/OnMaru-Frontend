import { describe, expect, it } from 'vitest';
import { LIVE_VILLAGE_TYPES, STAY_TYPE as CLASSIFY_STAY_TYPE } from './classify.mjs';
import { STAY_TYPE } from '../types';
import type { Village } from '../types';












const EXPECTED_LIVE_TYPES: Village['type'][] = [
  '고택',
  '민속마을',
  '고궁',
  '생가',
  '문',
  '서원·향교',
  STAY_TYPE,
];

describe('classify.mjs ↔ types.ts 유형 정합성', () => {
  it('LIVE_VILLAGE_TYPES가 Village.type 유니온과 정확히 같은 집합이다', () => {
    expect(new Set(LIVE_VILLAGE_TYPES)).toEqual(new Set(EXPECTED_LIVE_TYPES));
  });

  it('STAY_TYPE 리터럴이 classify.mjs와 types.ts에서 같다', () => {
    expect(CLASSIFY_STAY_TYPE).toBe(STAY_TYPE);
  });
});
