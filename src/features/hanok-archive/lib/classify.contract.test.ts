import { describe, expect, it } from 'vitest';
import { LIVE_VILLAGE_TYPES, STAY_TYPE as CLASSIFY_STAY_TYPE } from './classify.mjs';
import { STAY_TYPE } from '../types';
import type { Village } from '../types';

/*
  classify.mjs(순수 JS, 라이브+빌드스크립트 공용)와 types.ts(TS 전용)는 같은 파일을
  import할 수 없다 — 일반 node 스크립트가 .ts를 못 읽기 때문이다(세부 이유는
  classify.mjs 머리말 참고). 그래서 "라이브가 실제로 만드는 유형 7종"이 두 파일에
  따로 적혀 있다. 이 테스트가 둘을 대조해, 한쪽만 고치고 잊었을 때를 잡는다.

  EXPECTED_LIVE_TYPES에 `Village['type'][]` 타입을 직접 박아 둔 것도 같은 이유다 —
  여기 유니온에 없는 문자열을 적으면 tsc가 그 자리에서 실패한다(빌드 시점에 잡힘).
  반대 방향(유니온에 새 리터럴이 늘었는데 여기 안 옮겼을 때)은 아래 set-equality
  테스트가 잡는다.
*/
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
