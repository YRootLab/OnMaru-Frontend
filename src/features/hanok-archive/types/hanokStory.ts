export interface HanokStoryTimelineItem {
  period: string;
  title: string;
  detail: string;
}

export interface HanokStorySource {
  title: string;
  url: string;
}

export interface HanokStoryResponse {
  summary: string;
  timeline: HanokStoryTimelineItem[];
  highlights: string[];
  sources: HanokStorySource[];
  isAiGenerated: boolean;
  sourceMode: 'ai' | 'public' | 'unavailable';
}
