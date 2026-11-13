import {
  validateCulturalCollections,
  type CulturalCollection,
} from '@/features/map/domain/culturalCollection';

export const CULTURAL_COLLECTIONS: readonly CulturalCollection[] = [
  {
    id: 'hanok-neighborhoods',
    scope: 'hanok-home',
    title: { ko: '한옥이 이어지는 동네' },
    subtitle: { ko: '한옥과 우리 문화가 오늘의 공간에 남긴 이야기를 만나보세요.' },
    provenance: 'OnMaru editorial collection',
    placeRefs: [],
  },
];

validateCulturalCollections(CULTURAL_COLLECTIONS);
