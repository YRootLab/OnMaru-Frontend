import { describe, expect, it } from 'vitest';
import { classifyHeritageHouse } from '../lib/classify.mjs';

describe('classifyHeritageHouse', () => {
  it('splits Confucian academies out of the 고택 bucket', () => {
    expect(classifyHeritageHouse('병산서원', '경북 안동시')).toBe('서원·향교');
    expect(classifyHeritageHouse('전주향교', '전북 전주시')).toBe('서원·향교');
  });

  it('leaves residential houses as 고택', () => {
    expect(classifyHeritageHouse('구례 운조루', '전남 구례군')).toBe('고택');
    expect(classifyHeritageHouse('강릉 선교장', '강원 강릉시')).toBe('고택');
  });
});
