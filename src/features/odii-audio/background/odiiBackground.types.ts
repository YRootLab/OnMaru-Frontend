export type OdiiBackgroundVariant =
  | 'default'
  | 'warmth-grain'
  | 'changho-breeze'
  | 'hanji-journey'
  | 'onmaru-signature';

export type OdiiBackgroundStage =
  | 'featured'
  | 'themes'
  | 'nearby'
  | 'related'
  | 'archive'
  | 'collection'
  | 'closing';

export type OdiiBackgroundCategory =
  | 'default'
  | 'hanok'
  | 'market'
  | 'village'
  | 'palace'
  | 'nature';

export type OdiiBackgroundMotif =
  | 'open'
  | 'paper'
  | 'leaf'
  | 'timber'
  | 'catalog'
  | 'seal';

export type OdiiBackgroundMotionLevel = 'quiet' | 'gentle';

export interface OdiiBackgroundScene {
  variant: OdiiBackgroundVariant;
  stage: OdiiBackgroundStage;
  category: OdiiBackgroundCategory;
  motif: OdiiBackgroundMotif;
  motionLevel: OdiiBackgroundMotionLevel;
}

export interface OdiiBackgroundPresentation {
  hanjiAir: number;
  hospitalityLight: number;
  thresholdShadow: number;
  gardenShadow: number;
  warmthField: number;
  paperDepth: number;
}
