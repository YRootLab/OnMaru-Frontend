import { OdiiStoryItem } from './odii.types';

export type OdiiAtmosphereId = 'hanok' | 'seowon' | 'market' | 'temple' | 'archive';

export interface OdiiAtmosphere {
  id: OdiiAtmosphereId;
  backgroundColor: string;
  radialGradient: string;
  texture: string;
  textureOpacity: number;
  stagePattern: string;
  stageOpacity: number;
}

export interface OdiiChapterDefinition {
  id: Exclude<OdiiAtmosphereId, 'archive'>;
  keyword: string;
  title: string;
  subTitle?: string;
  narrative: string;
  keywords: string[];
  heroImageUrl?: string;
  mood?: string;
  atmosphere: OdiiAtmosphere;
}

export interface OdiiChapterPresentation extends OdiiChapterDefinition {
  story: OdiiStoryItem | null;
  stories: OdiiStoryItem[];
}
