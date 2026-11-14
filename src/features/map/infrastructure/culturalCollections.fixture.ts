import {
  validateCulturalCollections,
  type CulturalCollection,
} from '@/features/map/domain/culturalCollection';

export const CULTURAL_COLLECTIONS: readonly CulturalCollection[] = [
  {
    id: 'hanok-neighborhoods',
    scope: 'hanok-home',
    title: { ko: '한옥에서 시작하는 한국의 하루', en: 'A day in Korea, beginning with Hanok' },
    subtitle: {
      ko: '한옥의 마당에서 시작해 지역의 맛과 손으로 만드는 경험까지 이어가 보세요.',
      en: 'Start in a Hanok courtyard, then continue into local food and hands-on traditions.',
    },
    provenance: 'OnMaru editorial collection',
    placeRefs: [],
    paths: [
      { id: 'stay', label: '한옥에 머물다', category: 'stay', searchQuery: '한옥스테이' },
      { id: 'food', label: '지역을 맛보다', category: 'food', searchQuery: '향토음식' },
      { id: 'experience', label: '손으로 만들다', category: 'experience', searchQuery: '체험' },
      { id: 'market', label: '시장을 걷다', category: 'market', searchQuery: '전통시장' },
    ],
  },
];

validateCulturalCollections(CULTURAL_COLLECTIONS);
