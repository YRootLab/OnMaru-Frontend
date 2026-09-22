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
  private whaleBeEndpoint: string | null = process.env.NEXT_PUBLIC_WHALEBE_API_URL || null;




  public async getRecommendationForNode(node: ConstellationNode): Promise<RecommendationResult> {

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
        console.warn('[WhaleBE Recommendation] 백엔드 호출 실패, Sorimaru 실시간으로 폴백합니다.', err);
      }
    }


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
