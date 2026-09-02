import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { OdiiAtmosphereId } from '@/features/odii-audio/types/odiiChapter.types';

interface KeywordCandidate {
  label: string;
  terms: string[];
  priority: number;
}

const KEYWORD_CANDIDATES: Record<Exclude<OdiiAtmosphereId, 'archive'>, KeywordCandidate[]> = {
  hanok: [
    { label: '한옥', terms: ['한옥', '고택', '한옥마을'], priority: 5 },
    { label: '처마', terms: ['처마', '지붕'], priority: 4 },
    { label: '마루', terms: ['대청마루', '툇마루', '마루'], priority: 4 },
    { label: '창호', terms: ['창호', '문살', '창문'], priority: 3 },
    { label: '마당', terms: ['마당', '뜰'], priority: 3 },
    { label: '기와', terms: ['기와'], priority: 3 },
    { label: '사랑채', terms: ['사랑채', '안채'], priority: 3 },
    { label: '온돌', terms: ['온돌', '구들'], priority: 3 },
    { label: '골목', terms: ['골목', '담장'], priority: 2 },
  ],
  seowon: [
    { label: '서원', terms: ['서원', '향교'], priority: 5 },
    { label: '선비', terms: ['선비', '유생'], priority: 4 },
    { label: '묵향', terms: ['묵향', '먹'], priority: 3 },
    { label: '강학', terms: ['강학', '공부', '교육'], priority: 3 },
    { label: '제향', terms: ['제향', '제사'], priority: 3 },
    { label: '정자', terms: ['정자', '누각'], priority: 2 },
    { label: '고요', terms: ['고요', '마음'], priority: 1 },
  ],
  market: [
    { label: '전통시장', terms: ['전통시장', '시장', '장터'], priority: 5 },
    { label: '사람', terms: ['사람', '상인', '손님'], priority: 4 },
    { label: '흥정', terms: ['흥정', '거래'], priority: 3 },
    { label: '먹거리', terms: ['먹거리', '음식', '맛집', '시장 음식'], priority: 3 },
    { label: '오일장', terms: ['오일장', '장날'], priority: 3 },
    { label: '정', terms: ['정', '인심'], priority: 2 },
    { label: '골목', terms: ['골목', '가게'], priority: 2 },
  ],
  temple: [
    { label: '사찰', terms: ['사찰', '산사', '절'], priority: 5 },
    { label: '종소리', terms: ['종소리', '범종', '종'], priority: 4 },
    { label: '산안개', terms: ['산안개', '안개', '구름'], priority: 3 },
    { label: '불상', terms: ['불상', '부처'], priority: 3 },
    { label: '전각', terms: ['전각', '대웅전', '법당'], priority: 3 },
    { label: '숲길', terms: ['숲길', '산길', '오솔길'], priority: 2 },
    { label: '마음', terms: ['마음', '명상'], priority: 1 },
  ],
};

const normalize = (value: string): string => value.toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');

const includesTerm = (text: string, term: string): boolean => normalize(text).includes(normalize(term));

/**
 * API가 내려준 제목·장소·대본에서 챕터별 의미 있는 단어만 골라낸다.
 * 형태소 분석기를 추가하지 않고도 결과가 흔들리지 않도록 문화 공간별 어휘 사전을 사용한다.
 */
export function extractOdiiStoryKeywords(
  story: OdiiStoryItem,
  fallbackKeywords: string[],
  atmosphereId: Exclude<OdiiAtmosphereId, 'archive'>,
  limit = 4,
): string[] {
  const titleText = [story.title, story.audioTitle, story.locationName, story.category].filter(Boolean).join(' ');
  const bodyText = story.script || '';
  const candidates = KEYWORD_CANDIDATES[atmosphereId] || [];

  const matchedKeywords = candidates
    .map((candidate, index) => {
      const titleMatch = candidate.terms.some((term) => includesTerm(titleText, term));
      const bodyMatch = candidate.terms.some((term) => includesTerm(bodyText, term));
      return {
        label: candidate.label,
        score: (titleMatch ? 6 : 0) + (bodyMatch ? 2 : 0) + candidate.priority / 100 - index / 10000,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ label }) => label);

  return matchedKeywords.length > 0 ? matchedKeywords : fallbackKeywords.slice(0, limit);
}
