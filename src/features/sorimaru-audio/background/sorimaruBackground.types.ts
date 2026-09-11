export type SorimaruBackgroundVariant =
  | 'default'
  | 'warmth-grain'
  | 'changho-breeze'
  | 'hanji-journey'
  | 'onmaru-signature';

export type SorimaruBackgroundStage =
  | 'featured'
  | 'themes'
  | 'nearby'
  | 'related'
  | 'archive'
  | 'collection'
  | 'closing';

export type SorimaruBackgroundCategory =
  | 'default'
  | 'hanok'
  | 'market'
  | 'village'
  | 'palace'
  | 'nature';

export type SorimaruBackgroundMotif =
  | 'open'
  | 'paper'
  | 'leaf'
  | 'timber'
  | 'catalog'
  | 'seal';

export type SorimaruBackgroundMotionLevel = 'quiet' | 'gentle';

export interface SorimaruBackgroundScene {
  variant: SorimaruBackgroundVariant;
  stage: SorimaruBackgroundStage;
  category: SorimaruBackgroundCategory;
  motif: SorimaruBackgroundMotif;
  motionLevel: SorimaruBackgroundMotionLevel;
}

export interface SorimaruBackgroundPresentation {
  hanjiAir: number;
  hospitalityLight: number;
  thresholdShadow: number;
  gardenShadow: number;
  warmthField: number;
  paperDepth: number;
}

export interface SorimaruBackgroundPalette {
  canvas: '#ffffff';
  paper: '#ffffff';
  lightRgb: string;
  fiberRgb: string;
  shadowRgb: string;
  accentRgb: string;
}
