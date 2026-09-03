import type { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

export type KoreaRegion = {
  id: 'capital' | 'gangwon' | 'chungcheong' | 'jeolla' | 'gyeongsang' | 'jeju';
  label: string;
  shortLabel: string;
  path: string;
  labelX: number;
  labelY: number;
  keywords: string[];
};

export const KOREA_REGIONS: KoreaRegion[] = [
  { id: 'capital', label: '서울·경기·인천', shortLabel: '수도권', path: 'M116 72 L177 52 L218 86 L209 125 L177 151 L121 139 L91 109 Z', labelX: 153, labelY: 104, keywords: ['서울', '경기', '인천', '수원', '강화'] },
  { id: 'gangwon', label: '강원', shortLabel: '강원', path: 'M177 52 L238 61 L286 98 L307 164 L276 210 L230 213 L193 181 L177 151 L209 125 L218 86 Z', labelX: 242, labelY: 132, keywords: ['강원', '강릉', '속초', '춘천', '평창'] },
  { id: 'chungcheong', label: '충청·대전·세종', shortLabel: '충청', path: 'M121 139 L177 151 L193 181 L230 213 L259 235 L239 287 L182 278 L135 258 L91 218 Z', labelX: 171, labelY: 221, keywords: ['충북', '충남', '충청', '대전', '세종', '공주', '부여'] },
  { id: 'jeolla', label: '전라·광주', shortLabel: '전라', path: 'M91 218 L135 258 L182 278 L239 287 L218 342 L196 397 L164 449 L108 458 L67 421 L52 371 L75 321 Z', labelX: 132, labelY: 353, keywords: ['전북', '전남', '전라', '광주', '전주', '남원', '순천', '여수'] },
  { id: 'gyeongsang', label: '경상·부산·대구·울산', shortLabel: '경상', path: 'M259 235 L276 210 L307 164 L322 231 L315 303 L294 368 L260 424 L218 453 L164 449 L196 397 L218 342 L239 287 Z', labelX: 263, labelY: 327, keywords: ['경북', '경남', '경상', '부산', '대구', '울산', '안동', '경주'] },
  { id: 'jeju', label: '제주', shortLabel: '제주', path: 'M128 510 C151 497 194 496 221 506 C209 521 169 529 136 522 Z', labelX: 173, labelY: 513, keywords: ['제주', '서귀포', '한라'] },
];

type RegionStory = Pick<OdiiStoryItem, 'title' | 'audioTitle' | 'category'> & Partial<Pick<OdiiStoryItem, 'locationName'>>;

export function matchStoriesToRegion<T extends RegionStory>(stories: T[], region: KoreaRegion): T[] {
  return stories.filter((story) => {
    const searchable = `${story.locationName || ''} ${story.title} ${story.audioTitle} ${story.category}`;
    return region.keywords.some((keyword) => searchable.includes(keyword));
  });
}
