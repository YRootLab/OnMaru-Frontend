import type { Village } from '@/features/hanok-archive/types';

/** type 기반 한옥 구조 태그 추론 */
export function inferStructureTags(village: Village): string[] {
  const t = village.type;
  if (t === '고궁') return ['팔작지붕', '공포식', '기단', '기와'];
  if (t === '서원·향교') return ['맞배지붕', '홑처마', '기와'];
  if (t === '고태' || t === '고택' || t === '생가') return ['기와집', '안채·사랑채', '전통마루'];
  if (t === '민속마을') return ['초가', '기와', '전통담장'];
  if (t === '사찰') return ['팔작지붕', '다포식', '기단'];
  return ['기와'];
}

/** overview/summary/badges 에서 문화재 등급 추출 */
export function extractHeritageGrade(village: Village): string | null {
  const text = `${village.overview} ${village.summary} ${village.badges.join(' ')}`;
  if (/국보/.test(text)) return '국보';
  if (/보물/.test(text)) return '보물';
  if (/(?<![가-힣])사적(?![가-힣])/.test(text)) return '사적';
  if (/명승/.test(text)) return '명승';
  if (/등록문화재/.test(text)) return '등록문화재';
  if (/문화재/.test(text)) return '문화재';
  return null;
}

const REGION_SEASON: Record<string, string[]> = {
  서울: ['봄꽃', '단풍'],
  경기: ['봄꽃', '단풍'],
  강원: ['설경', '단풍'],
  경북: ['봄꽃', '단풍', '설경'],
  경남: ['봄꽃', '단풍'],
  전북: ['봄꽃', '단풍'],
  전남: ['봄꽃', '단풍'],
  충남: ['봄꽃', '단풍'],
  충북: ['봄꽃', '단풍'],
  제주: ['봄꽃', '억새'],
  인천: ['봄꽃'],
  대구: ['봄꽃', '단풍'],
  부산: ['봄꽃'],
  광주: ['봄꽃'],
};

/** region 기반 방문 시즌 추천 */
export function inferSeasonTags(village: Village): string[] {
  return REGION_SEASON[village.region] ?? ['봄꽃', '단풍'];
}
