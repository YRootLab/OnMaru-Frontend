export interface OdiiCategoryDefinition {
  id: string;
  keyword: string;
  shortLabel: string;
  label: string;
  description: string;
}

export const ODII_THEME_CATEGORIES: OdiiCategoryDefinition[] = [
  { id: 'hanok', keyword: '한옥', shortLabel: '한옥의 바람', label: '한옥/고택', description: '처마와 마루에 머무는 느린 아침' },
  { id: 'seowon', keyword: '서원', shortLabel: '서원의 묵향', label: '서원/향교', description: '종이와 먹, 오래된 배움의 시간' },
  { id: 'market', keyword: '시장', shortLabel: '시장과 정', label: '전통시장/장터', description: '말 한마디와 덤 한 줌의 온기' },
  { id: 'village', keyword: '골목', shortLabel: '골목의 발자국', label: '마을/골목길', description: '담장과 골목 사이 이어지는 생활의 소리' },
  { id: 'palace', keyword: '궁', shortLabel: '궁궐의 계절', label: '궁궐/역사', description: '왕실의 시간과 건축이 남긴 장면' },
  { id: 'temple', keyword: '사찰', shortLabel: '산사의 저녁', label: '사찰/산사', description: '산안개와 종소리가 건네는 쉼' },
  { id: 'sound', keyword: '소리', shortLabel: '소리의 기억', label: '소리/문화', description: '사람과 장소가 남긴 고유한 울림' },
  { id: 'museum', keyword: '박물관', shortLabel: '박물관의 고요', label: '박물관/미술관', description: '유물 곁에서 천천히 깊어지는 시선' },
  { id: 'nature', keyword: '길', shortLabel: '자연의 쉼', label: '자연/둘레길', description: '숲과 물을 따라 호흡을 고르는 시간' },
];

export interface OdiiHeroTab {
  id: string;
  label: string;
  keyword: string;
}

export const ODII_HERO_TABS: OdiiHeroTab[] = [
  { id: '추천', label: '오늘의 추천', keyword: '' },
  { id: '한옥', label: '한옥의 바람', keyword: '한옥' },
  { id: '서원', label: '서원의 묵향', keyword: '서원' },
  { id: '시장', label: '시장과 정', keyword: '시장' },
  { id: '사찰', label: '산사의 저녁', keyword: '사찰' },
];

export const ODII_REGION_CHIPS = ['경주', '전주', '안동', '서울', '제주', '부산', '대구'] as const;
