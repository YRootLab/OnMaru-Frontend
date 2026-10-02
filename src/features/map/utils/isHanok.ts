/**
 * 한옥 판별 (isHanok) 모듈
 *
 * 판별 우선순위:
 * 1순위: 건축물대장 strctCdNm이 목구조 계열 + roofCdNm이 기와
 * 2순위: 행안부 한옥체험업 등록 여부 (entNm 매칭)
 * 3순위: TourAPI 키워드 (한옥, 고택, 종택 등)
 *
 * 원칙:
 * - 판별이 불확실하면 마크를 달지 않는다 (오탐 방지 우선).
 * - 판별 결과는 인메모리 맵에 캐싱하여 고속 조회.
 */

export interface HanokCandidate {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  addr?: string;
  addr1?: string;
  strctCdNm?: string;
  roofCdNm?: string;
  entNm?: string;
  cat3?: string;
  intro?: Record<string, string>;
  isTraditional?: boolean;
  isHanokExperienceRegistered?: boolean;
  isOfficialHanokStay?: boolean;
  contentId?: string | number;
}

// 목구조 계열 정규식
const WOOD_STRUCTURE_REGEX = /(목구조|목조|한식목구조|기타목구조|통나무구조)/i;

// 기와 지붕 정규식
const GIWA_ROOF_REGEX = /(기와|한식기와|시멘트기와|일반기와)/i;

// 3순위 확실한 한옥/고택/종택 키워드
const HANOK_KEYWORDS = ['한옥', '고택', '종택', '재실', '종가'];

// 한옥이 아님을 나타내는 배제어 (현대식 숙소, 양옥 등)
const EXCLUSION_KEYWORDS = [
  '현대식',
  '콘크리트',
  '호텔',
  '모텔',
  '리조트',
  '글램핑',
  '카라반',
  '캠핑장',
  '펜션형',
  '양옥',
  '빌라',
  '아파트',
];

// 인메모리 판별 캐시
const hanokCache = new Map<string, boolean>();

function getCacheKey(place: any): string {
  return (
    place?.id?.toString() ||
    place?.contentId?.toString() ||
    place?.name?.toString() ||
    place?.title?.toString() ||
    ''
  );
}

/**
 * 1순위: 건축물대장 데이터 기반 판별
 * @returns boolean | null (데이터가 없어 판별 불가 시 null 반환하여 다음 순위로 폴백)
 */
function checkBuildingRegister(place: any): boolean | null {
  const strct = (
    place?.strctCdNm ||
    place?.strct ||
    place?.structure ||
    place?.intro?.['구조'] ||
    place?.intro?.['건축구조'] ||
    ''
  ).toString();

  const roof = (
    place?.roofCdNm ||
    place?.roof ||
    place?.roofType ||
    place?.intro?.['지붕'] ||
    place?.intro?.['지붕형태'] ||
    ''
  ).toString();

  // 둘 다 존재할 경우 엄격한 판별
  if (strct && roof) {
    const isWood = WOOD_STRUCTURE_REGEX.test(strct);
    const isGiwa = GIWA_ROOF_REGEX.test(roof);
    // 목구조 + 기와 지붕이면 확실한 한옥
    if (isWood && isGiwa) return true;
    // 철골/콘크리트/슬레이트 등 명확히 다른 구조라면 false
    return false;
  }

  // 한쪽만 존재하는 경우
  if (strct) {
    if (!WOOD_STRUCTURE_REGEX.test(strct)) return false;
  }
  if (roof) {
    if (!GIWA_ROOF_REGEX.test(roof)) return false;
  }

  return null;
}

/**
 * 2순위: 행안부 한옥체험업 등록 여부 매칭
 */
function checkHanokExperienceRegistration(place: any, placeName: string): boolean {
  if (place?.isHanokExperienceRegistered || place?.isOfficialHanokStay) {
    return true;
  }

  const entNm = (
    place?.entNm ||
    place?.hanokExpEntNm ||
    place?.businessName ||
    ''
  )
    .toString()
    .trim();

  if (entNm && placeName) {
    const cleanPlace = placeName.replace(/\s+/g, '');
    const cleanEnt = entNm.replace(/\s+/g, '');
    if (cleanPlace.includes(cleanEnt) || cleanEnt.includes(cleanPlace)) {
      return true;
    }
  }

  return false;
}

/**
 * 3순위: TourAPI 키워드 기반 판별 (한옥, 고택, 종택 등)
 */
function checkTourApiKeywords(placeName: string, cat3 = ''): boolean {
  if (!placeName) return false;

  // 배제어 검사
  if (EXCLUSION_KEYWORDS.some((ex) => placeName.includes(ex))) {
    return false;
  }

  // 확실한 한옥 키워드 포함 여부
  if (HANOK_KEYWORDS.some((kw) => placeName.includes(kw))) {
    return true;
  }

  // TourAPI 고택/한옥스테이 카테고리 코드 (B02011600: 한옥스테이)
  if (cat3 === 'B02011600') {
    return true;
  }

  return false;
}

/**
 * 한옥 여부를 판별하는 메인 함수
 *
 * @param place 검사 대상 장소 객체 (Item, PlaceDetailData, InfoPlaceItem 등)
 * @returns true면 한옥(표식 대상), false면 미표식
 */
export function isHanok(place: any): boolean {
  if (!place) return false;

  const cacheKey = getCacheKey(place);
  if (cacheKey && hanokCache.has(cacheKey)) {
    return hanokCache.get(cacheKey)!;
  }

  const placeName = (place.name || place.title || '').trim();

  // 1순위: 건축물대장 데이터
  const bldResult = checkBuildingRegister(place);
  if (bldResult !== null) {
    if (cacheKey) hanokCache.set(cacheKey, bldResult);
    return bldResult;
  }

  // 2순위: 행안부 한옥체험업 등록 여부
  if (checkHanokExperienceRegistration(place, placeName)) {
    if (cacheKey) hanokCache.set(cacheKey, true);
    return true;
  }

  // 3순위: TourAPI 키워드 (한옥, 고택, 종택 등)
  const cat3 = (place.cat3 || (place as Record<string, unknown>).cat3Code || '').toString();
  const keywordResult = checkTourApiKeywords(placeName, cat3);

  if (cacheKey) hanokCache.set(cacheKey, keywordResult);
  return keywordResult;
}

/**
 * 테스트 및 데이터 갱신 시 캐시 초기화
 */
export function clearHanokCache(): void {
  hanokCache.clear();
}
