import { OdiiStoryItem } from '../types/odii.types';
import { MOCK_ODII_STORIES } from './odiiMockData';

/**
 * 한국관광공사 오디(Odii) API 어댑터
 * - 8월 3일 API Key 발급 시 내부 fetch 로직만 실시간 API로 스위칭됩니다.
 * - 모든 UI 컴포넌트는 이 어댑터를 거쳐 오직 OdiiStoryItem 타입만 공급받으므로 UI 코드 수정 제로(0)를 보장합니다.
 */
export const odiiApiAdapter = {
  /**
   * 오디오 이야기 목록 조회 (카테고리 & 검색어 필터링)
   */
  async getStoryList(category?: string, query?: string): Promise<OdiiStoryItem[]> {
    // API Key 준비 전 Mock Data 응답 (0.1초 딜레이로 비동기 어댑터 동작 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 100));

    let filtered = MOCK_ODII_STORIES;

    if (category && category !== '전체') {
      filtered = filtered.filter((s) => s.category === category);
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.audioTitle.toLowerCase().includes(q) ||
          s.script.toLowerCase().includes(q) ||
          (s.locationName && s.locationName.toLowerCase().includes(q))
      );
    }

    return filtered;
  },

  /**
   * 특정 이야기 상세 정보 조회
   */
  async getStoryDetail(stid: string): Promise<OdiiStoryItem | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const found = MOCK_ODII_STORIES.find((s) => s.stid === stid);
    return found || null;
  },

  /**
   * 위치 기반(LBS) 내 주변 이야기 목록 조회
   */
  async getNearbyStories(mapX?: string, mapY?: string): Promise<OdiiStoryItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return MOCK_ODII_STORIES.slice(0, 4);
  }
};
