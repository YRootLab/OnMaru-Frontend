import { SorimaruStoryItem } from './sorimaru.types';

export type SorimaruAtmosphereId = 'hanok' | 'seowon' | 'market' | 'temple' | 'archive';

export interface SorimaruAtmosphere {
  id: SorimaruAtmosphereId;
  backgroundColor: string;
  radialGradient: string;
  texture: string;
  textureOpacity: number;
  stagePattern: string;
  stageOpacity: number;
}

export interface SorimaruChapterDefinition {
  id: Exclude<SorimaruAtmosphereId, 'archive'>;
  keyword: string;
  title: string;
  subTitle?: string;
  narrative: string;
  keywords: string[];
  heroImageUrl?: string;
  mood?: string;
  atmosphere: SorimaruAtmosphere;
}

export interface SorimaruChapterPresentation extends SorimaruChapterDefinition {
  story: SorimaruStoryItem | null;
  stories: SorimaruStoryItem[];
}
