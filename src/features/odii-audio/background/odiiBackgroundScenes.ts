import type {
  OdiiBackgroundCategory,
  OdiiBackgroundMotif,
  OdiiBackgroundPresentation,
  OdiiBackgroundScene,
  OdiiBackgroundStage,
  OdiiBackgroundVariant,
} from './odiiBackground.types';

export const ODII_BACKGROUND_STAGES = [
  'featured',
  'themes',
  'nearby',
  'related',
  'archive',
  'collection',
  'closing',
] as const satisfies readonly OdiiBackgroundStage[];

const CATEGORY_MODIFIERS: Record<string, OdiiBackgroundCategory> = {
  한옥: 'hanok',
  시장: 'market',
  마을: 'village',
  궁: 'palace',
  길: 'nature',
};

const STAGE_MOTIFS: Record<OdiiBackgroundStage, OdiiBackgroundMotif> = {
  featured: 'open',
  themes: 'paper',
  nearby: 'leaf',
  related: 'timber',
  archive: 'catalog',
  collection: 'paper',
  closing: 'seal',
};

const TEAR_BOUNDARIES: Record<OdiiBackgroundVariant, readonly OdiiBackgroundStage[]> = {
  default: [],
  'warmth-grain': [],
  'changho-breeze': [],
  'hanji-journey': ['nearby', 'archive'],
  'onmaru-signature': ['archive'],
};

const VARIANT_PRESENTATIONS: Record<OdiiBackgroundVariant, OdiiBackgroundPresentation> = {
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

export function resolveOdiiBackgroundCategory(category: string): OdiiBackgroundCategory {
  return CATEGORY_MODIFIERS[category] ?? 'default';
}

export function resolveOdiiBackgroundScene(
  variant: OdiiBackgroundVariant,
  stage: OdiiBackgroundStage,
  category: string,
): OdiiBackgroundScene {
  return {
    variant,
    stage,
    category: resolveOdiiBackgroundCategory(category),
    motif: STAGE_MOTIFS[stage],
    motionLevel: stage === 'archive' ? 'quiet' : 'gentle',
  };
}

export function getOdiiTearBoundaries(
  variant: OdiiBackgroundVariant,
): readonly OdiiBackgroundStage[] {
  return TEAR_BOUNDARIES[variant];
}

export function resolveOdiiBackgroundPresentation(
  variant: OdiiBackgroundVariant,
): OdiiBackgroundPresentation {
  return VARIANT_PRESENTATIONS[variant];
}
