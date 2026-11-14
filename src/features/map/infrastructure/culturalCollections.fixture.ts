import {
  validateCulturalCollections,
  type CulturalCollection,
} from '@/features/map/domain/culturalCollection';

export const CULTURAL_COLLECTIONS: readonly CulturalCollection[] = [
  {
    id: 'hanok-neighborhoods',
    scope: 'hanok-home',
    title: { ko: '동네에서 만나는 한옥 문화', en: 'Hanok culture in the neighborhood' },
    subtitle: {
      ko: '한옥 공간이 오늘의 동네와 어떻게 이어지는지 발견해 보세요.',
      en: 'Discover how living Hanok culture connects places, people, and everyday neighborhoods.',
    },
    provenance: 'OnMaru editorial collection',
    placeRefs: [],
  },
];

validateCulturalCollections(CULTURAL_COLLECTIONS);
