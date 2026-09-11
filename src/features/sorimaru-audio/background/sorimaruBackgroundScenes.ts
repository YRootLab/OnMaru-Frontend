import type {
  SorimaruBackgroundCategory,
  SorimaruBackgroundMotif,
  SorimaruBackgroundPalette,
  SorimaruBackgroundPresentation,
  SorimaruBackgroundScene,
  SorimaruBackgroundStage,
  SorimaruBackgroundVariant,
} from './sorimaruBackground.types';

export const SORIMARU_BACKGROUND_PALETTE: SorimaruBackgroundPalette = {
  canvas: '#ffffff',
  paper: '#ffffff',
  lightRgb: '255, 255, 255',
  fiberRgb: '112, 112, 112',
  shadowRgb: '70, 70, 70',
  accentRgb: '145, 145, 145',
};

export const SORIMARU_BACKGROUND_STAGES = [
  'featured',
  'themes',
  'nearby',
  'related',
  'archive',
  'collection',
  'closing',
] as const satisfies readonly SorimaruBackgroundStage[];

const CATEGORY_MODIFIERS: Record<string, SorimaruBackgroundCategory> = {
  한옥: 'hanok',
  시장: 'market',
  마을: 'village',
  궁: 'palace',
  길: 'nature',
};

const STAGE_MOTIFS: Record<SorimaruBackgroundStage, SorimaruBackgroundMotif> = {
  featured: 'open',
  themes: 'paper',
  nearby: 'leaf',
  related: 'timber',
  archive: 'catalog',
  collection: 'paper',
  closing: 'seal',
};

const TEAR_BOUNDARIES: Record<SorimaruBackgroundVariant, readonly SorimaruBackgroundStage[]> = {
  default: [],
  'warmth-grain': [],
  'changho-breeze': [],
  'hanji-journey': ['nearby', 'archive'],
  'onmaru-signature': ['archive'],
};

const VARIANT_PRESENTATIONS: Record<SorimaruBackgroundVariant, SorimaruBackgroundPresentation> = {
  default: {
    hanjiAir: 0,
    hospitalityLight: 0.2,
    thresholdShadow: 0,
    gardenShadow: 0,
    warmthField: 0,
    paperDepth: 0,
  },
  'warmth-grain': {
    hanjiAir: 0.62,
    hospitalityLight: 0.92,
    thresholdShadow: 0.18,
    gardenShadow: 0.2,
    warmthField: 1,
    paperDepth: 0.22,
  },
  'changho-breeze': {
    hanjiAir: 0.38,
    hospitalityLight: 0.72,
    thresholdShadow: 1,
    gardenShadow: 0.9,
    warmthField: 0.28,
    paperDepth: 0.18,
  },
  'hanji-journey': {
    hanjiAir: 0.88,
    hospitalityLight: 0.45,
    thresholdShadow: 0.22,
    gardenShadow: 0.18,
    warmthField: 0.2,
    paperDepth: 1,
  },
  'onmaru-signature': {
    hanjiAir: 0.64,
    hospitalityLight: 0.84,
    thresholdShadow: 0.72,
    gardenShadow: 0.66,
    warmthField: 0.68,
    paperDepth: 0.58,
  },
};

export function resolveSorimaruBackgroundCategory(category: string): SorimaruBackgroundCategory {
  return CATEGORY_MODIFIERS[category] ?? 'default';
}

export function resolveSorimaruBackgroundScene(
  variant: SorimaruBackgroundVariant,
  stage: SorimaruBackgroundStage,
  category: string,
): SorimaruBackgroundScene {
  return {
    variant,
    stage,
    category: resolveSorimaruBackgroundCategory(category),
    motif: STAGE_MOTIFS[stage],
    motionLevel: stage === 'archive' ? 'quiet' : 'gentle',
  };
}

export function getSorimaruTearBoundaries(
  variant: SorimaruBackgroundVariant,
): readonly SorimaruBackgroundStage[] {
  return TEAR_BOUNDARIES[variant];
}

export function resolveSorimaruBackgroundPresentation(
  variant: SorimaruBackgroundVariant,
): SorimaruBackgroundPresentation {
  return VARIANT_PRESENTATIONS[variant];
}
