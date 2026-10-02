import { describe, it, expect, beforeEach } from 'vitest';
import { isHanok, clearHanokCache } from './isHanok';

describe('isHanok 판별 로직 및 우선순위 테스트', () => {
  beforeEach(() => {
    clearHanokCache();
  });

  describe('1순위: 건축물대장 (strctCdNm / roofCdNm)', () => {
    it('목구조 계열 + 기와 지붕이면 확실한 한옥으로 판별 (true)', () => {
      expect(
        isHanok({
          name: '무명 공간',
          strctCdNm: '일반목구조',
          roofCdNm: '한식기와',
        })
      ).toBe(true);
    });

    it('intro 구조/지붕 필드가 목조 + 기와이면 한옥으로 판별 (true)', () => {
      expect(
        isHanok({
          name: '어느 쉼터',
          intro: {
            구조: '전통 목구조',
            지붕: '기와',
          },
        })
      ).toBe(true);
    });

    it('건축물대장에 철골/슬레이트 등 명확한 비목조/비기와 구조가 있으면 false (오탐 방지)', () => {
      expect(
        isHanok({
          name: '한옥느낌 카페',
          strctCdNm: '철근콘크리트구조',
          roofCdNm: '슬레이트',
        })
      ).toBe(false);
    });
  });

  describe('2순위: 행안부 한옥체험업 등록 여부 (entNm)', () => {
    it('건축물대장이 없을 때 행안부 등록 상호(entNm)와 매칭되면 true', () => {
      expect(
        isHanok({
          id: 'stay-01',
          name: '행복한옥스테이 본점',
          entNm: '행복한옥스테이',
        })
      ).toBe(true);
    });

    it('공식 한옥체험업 등록 플래그가 설정되어 있으면 true', () => {
      expect(
        isHanok({
          id: 'stay-02',
          name: '고운재',
          isOfficialHanokStay: true,
        })
      ).toBe(true);
    });
  });

  describe('3순위: TourAPI 키워드 (한옥, 고택, 종택 등)', () => {
    it('장소명에 "한옥"이 포함되어 있으면 true', () => {
      expect(isHanok({ id: 'p1', name: '전주 한옥마을 다원' })).toBe(true);
    });

    it('장소명에 "고택" 또는 "종택"이 포함되어 있으면 true', () => {
      expect(isHanok({ id: 'p2', name: '안동 임청각 고택' })).toBe(true);
      expect(isHanok({ id: 'p3', name: '노송정 종택' })).toBe(true);
    });

    it('현대식 숙소/호텔/글램핑 등 배제어가 포함되어 있으면 false', () => {
      expect(isHanok({ id: 'p4', name: '한옥 호텔 리조트' })).toBe(false);
      expect(isHanok({ id: 'p5', name: '모던 한옥 글램핑' })).toBe(false);
    });

    it('일반 숙소나 일반 카페 등 한옥 정보가 불확실하면 false (오탐 방지)', () => {
      expect(isHanok({ id: 'p6', name: '스타벅스 경주점', category: 'cafe' })).toBe(false);
      expect(isHanok({ id: 'p7', name: '해운대 비치 호텔', category: 'stay' })).toBe(false);
    });
  });

  describe('캐싱 동작 검증', () => {
    it('동일한 id의 장소는 캐시된 결과를 즉시 반환', () => {
      const place = { id: 'cache-test-1', name: '아름다운 한옥집' };
      expect(isHanok(place)).toBe(true);

      // 이름을 바꾸더라도 동일 id면 캐시된 결과 유지
      expect(isHanok({ id: 'cache-test-1', name: '일반 현대식 건물' })).toBe(true);

      // 캐시 초기화 후 재검사하면 변경된 결과 반영
      clearHanokCache();
      expect(isHanok({ id: 'cache-test-1', name: '일반 현대식 건물' })).toBe(false);
    });
  });
});
