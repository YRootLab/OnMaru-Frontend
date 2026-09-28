export interface SorimaruStorySummary {
  storyId: string;
  title: string;
  audioTitle: string;
  category: string;
  region: { regionCode: string; name: string; level: string; parentRegionCode: string | null };
  coordinates: { lat: number; lng: number } | null;
  durationSeconds: number;
  imageUrl: string | null;
  linkedPlaceId: string | null;
  contentTags: string[];
  savedByMe: boolean;
}

export interface SorimaruStoryDetail extends SorimaruStorySummary {
  audioUrl: string;
  transcript: Array<{ text: string; startTimeSeconds?: number }>;
}

export interface SorimaruStoryPage {
  items: SorimaruStorySummary[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SorimaruRegionGroup {
  label: string;
  regionCodes: string[];
  storyCount: number;
}

export interface SorimaruRegionGroups {
  groups: SorimaruRegionGroup[];
}

export interface SorimaruListQuery {
  language: string;
  category?: string;
  regionCode?: string;
  limit: number;
  cursor?: string;
}
