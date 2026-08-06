export interface OdiiCategoryDefinition {
  id: string;
  keyword: string;
  shortLabel: string;
  label: string;
  description: string;
}

export const ODII_THEME_CATEGORIES: OdiiCategoryDefinition[] = [
  { id: 'hanok', keyword: '한옥', shortLabel: '한옥의 바람', label: '한옥/고택', description: '처마와 마루에 머무는 느린 아침' },
  { id: 'market', keyword: '시장', shortLabel: '시장과 정', label: '전통시장/장터', description: '말 한마디와 덤 한 줌의 온기' },
  { id: 'village', keyword: '마을', shortLabel: '골목의 발자국', label: '마을/골목길', description: '담장과 골목 사이 이어지는 생활의 소리' },
  { id: 'palace', keyword: '궁', shortLabel: '궁궐의 계절', label: '궁궐/역사', description: '왕실의 시간과 건축이 남긴 장면' },
  { id: 'sound', keyword: '소리', shortLabel: '소리의 기억', label: '소리/문화', description: '사람과 장소가 남긴 고유한 울림' },
  { id: 'nature', keyword: '길', shortLabel: '자연의 쉼', label: '자연/둘레길', description: '숲과 물을 따라 호흡을 고르는 시간' },
];

export interface OdiiHeroTab {
  id: string;
  label: string;
  keyword: string;
}

export const ODII_HERO_TABS: OdiiHeroTab[] = [
  { id: '추천', label: '오늘의 추천', keyword: '' },
  { id: '한옥/고택', label: '한옥과 고택', keyword: '한옥' },
  { id: '전통시장/장터', label: '시장과 정', keyword: '시장' },
  { id: '마을/골목길', label: '마을과 골목', keyword: '골목' },
  { id: '궁궐/역사', label: '궁궐과 역사', keyword: '궁' },
  { id: '소리/문화', label: '소리와 문화', keyword: '소리' },
  { id: '자연/둘레길', label: '자연과 길', keyword: '길' },
];

export const ODII_REGION_CHIPS = ['경주', '전주', '안동', '서울', '제주', '부산', '대구'] as const;
