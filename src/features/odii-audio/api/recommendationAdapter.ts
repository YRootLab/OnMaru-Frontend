import { odiiApiAdapter } from './odiiApi';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { CONSTELLATION_NODES, ConstellationNode } from '@/features/odii-audio/data/constellationData';

export interface RecommendationResult {
  node: ConstellationNode;
  recommendedStory: OdiiStoryItem | null;
  candidateStories: OdiiStoryItem[];
  source: 'odii-realtime' | 'whalebe-ai';
}

/**
 * WhaleBE AI 백엔드 추천 시스템 이관을 위한 추상화 어댑터.
 * 현재는 Odii API 실시간 데이터 및 노드 가중치를 연동하며,
 * 향후 WhaleBE AI 백엔드가 완성되면 API URL을 전환하여 파인튜닝 모델을 연동합니다.
 */
class RecommendationAdapter {
  private whaleBeEndpoint: string | null = process.env.NEXT_PUBLIC_WHALEBE_API_URL || null;

  /**
   * 키워드 노드 클릭 시 연관된 Odii 스토리 목록 중 AI/가중치 기반으로 1개를 추천 및 무작위 선택합니다.
   */
  public async getRecommendationForNode(node: ConstellationNode): Promise<RecommendationResult> {
    // 1. WhaleBE 백엔드가 연결되어 있는 경우 (미래 확장)
    if (this.whaleBeEndpoint) {
      try {
        const response = await fetch(`${this.whaleBeEndpoint}/api/v1/recommend?keyword=${encodeURIComponent(node.keyword)}`);
        if (response.ok) {
          const data = await response.json();
          return {
            node,
            recommendedStory: data.story,
            candidateStories: data.candidates || [],
            source: 'whalebe-ai',
          };
        }
      } catch (err) {
        console.warn('[WhaleBE Recommendation] 백엔드 호출 실패, Odii 실시간으로 폴백합니다.', err);
      }
    }

    // 2. Odii API 실시간 호출 & 무작위 픽업 (현재 동작)
    const stories = await odiiApiAdapter.getStoryList(undefined, node.keyword);
    
    if (stories.length === 0) {
      return {
        node,
        recommendedStory: null,
        candidateStories: [],
        source: 'odii-realtime',
      };
    }

    // 키워드 스토리 중 무작위 1개 추출
    const randomIndex = Math.floor(Math.random() * stories.length);
    const recommendedStory = stories[randomIndex] || stories[0];

    return {
      node,
      recommendedStory,
      candidateStories: stories.slice(0, 5),
      source: 'odii-realtime',
    };
  }

  /**
   * 전체 노드의 최신 가중치 목록을 가져옵니다.
   */
  public getNodes(): ConstellationNode[] {
    return CONSTELLATION_NODES;
  }
}

export const recommendationAdapter = new RecommendationAdapter();
