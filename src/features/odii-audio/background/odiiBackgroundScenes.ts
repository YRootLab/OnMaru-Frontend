import type {
  OdiiBackgroundCategory,
  OdiiBackgroundMotif,
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
