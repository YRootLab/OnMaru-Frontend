import { sorimaruApiAdapter } from './sorimaruApi';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { CONSTELLATION_NODES, ConstellationNode } from '@/private/core-ui/sorimaru/constellationData';

export interface RecommendationResult {
  node: ConstellationNode;
  recommendedStory: SorimaruStoryItem | null;
  candidateStories: SorimaruStoryItem[];
  source: 'sorimaru-realtime' | 'whalebe-ai';
}






class RecommendationAdapter {
  // Single Source of Truth: 백엔드 API 경유
  // 프론트는 직접 Whale.Be를 호출하지 않음

  public async getRecommendationForNode(node: ConstellationNode): Promise<RecommendationResult> {
    // 모든 추천은 백엔드 `/api/recommendation?keyword=...`으로 위임
    // 백엔드가 Whale.Be 또는 Sorimaru를 선택해서 반환

    const stories = await sorimaruApiAdapter.getStoryList(undefined, node.keyword);

    if (stories.length === 0) {
      return {
        node,
        recommendedStory: null,
        candidateStories: [],
        source: 'sorimaru-realtime',
      };
    }


    const randomIndex = Math.floor(Math.random() * stories.length);
    const recommendedStory = stories[randomIndex] || stories[0];

    return {
      node,
      recommendedStory,
      candidateStories: stories.slice(0, 5),
      source: 'sorimaru-realtime',
    };
  }




  public getNodes(): ConstellationNode[] {
    return CONSTELLATION_NODES;
  }
}

export const recommendationAdapter = new RecommendationAdapter();
