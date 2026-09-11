/*
  TourAPI 원시 항목 → 도감 분류(지역/유형/뱃지) 로직.

  hanokArchive.service.ts(라이브 API 경로)와 scripts/build-fallback.mjs(정적 스냅샷
  생성 경로)가 이 파일 하나를 그대로 import한다. 두 경로가 같은 항목을 두고 다른
  유형·다른 뱃지를 매길 수 없으므로, 규칙은 한 곳에만 있어야 한다.

  일반 node 스크립트는 .ts를 직접 import하지 못해 순수 JS로 남긴다 — 프로젝트에
  ts-node/tsx가 없어, 타입만 벗기는 실험적 플래그에 기대는 대신 어디서나 그대로
  동작하는 쪽을 택했다. hanokArchive.service.ts는 allowJs 설정으로 이 파일을
  타입 없이(값만) 그대로 가져다 쓴다.

  Village.type 리터럴처럼 컴파일 시점 검증이 필요한 값은 여기 두지 않는다 —
  types.ts와의 정합성은 src/hanok/lib/classify.contract.test.ts가 대신 지킨다.
*/

/** 라이브 서비스가 요청하는 카테고리 6종. 관광공사 categoryCode2 공식 명칭 기준. */
export const CATEGORY_MAPPINGS = {
  STAY_HANOK: { contentTypeId: '32', cat1: 'B02', cat2: 'B0201', cat3: 'B02011600' },
  HERITAGE_HOUSE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010400' },
  FOLK_VILLAGE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010600' },
  PALACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010100' },
  BIRTHPLACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010500' },
  GATE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010300' },
};

/** src/hanok/types.ts의 STAY_TYPE과 반드시 같은 문자열이어야 한다(파일 import 불가 — contract 테스트가 대조). */
export const STAY_TYPE = '한옥스테이';

/**
 * 지금 라이브 서비스가 실제로 만들어내는 유형 값 전체.
 * types.ts의 Village.type 유니온과 (순서 무관) 정확히 같은 집합이어야 한다.
 */
export const LIVE_VILLAGE_TYPES = ['고택', '민속마을', '고궁', '생가', '문', '서원·향교', STAY_TYPE];

const AREA_MAP = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구', '5': '광주', '6': '부산', '7': '울산', '8': '세종',
  '31': '경기', '32': '강원', '33': '충북', '34': '충남', '35': '경북', '36': '경남', '37': '전북', '38': '전남', '39': '제주',
};

const REGION_ALIASES = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원',
  충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전북특별자치도: '전북',
  전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주도: '제주', 제주특별자치도: '제주',
};

/*
  전남·광주 통합으로 TourAPI 주소 접두어에 '전남광주통합특별시'가 섞여 나온다.
  areacode가 비어 있는 항목이 이 접두어로만 지역을 말하므로, 별칭표로는 못 푼다 —
  하나의 접두어가 전남과 광주 둘을 가리키기 때문이다. 뒤따르는 시군구로 가른다.
*/
const MERGED_JEONNAM_GWANGJU = '전남광주통합특별시';
const GWANGJU_DISTRICTS = ['동구', '서구', '남구', '북구', '광산구'];

export function resolveRegion(areacode, addr) {
  if (AREA_MAP[areacode]) return AREA_MAP[areacode];

  const parts = String(addr ?? '').split(' ');
  const head = parts[0] ?? '';

  if (head === MERGED_JEONNAM_GWANGJU) {
    return GWANGJU_DISTRICTS.includes(parts[1] ?? '') ? '광주' : '전남';
  }

  return REGION_ALIASES[head] || head || '기타';
}

/*
  A02010400 '고택' 안에는 조선의 유교 교육기관인 서원·향교도 섞여 있다. 하나는 살림집,
  하나는 강학 공간이라 건축 목적 자체가 다른데 관광공사 분류표엔 둘을 가를 코드가
  따로 없다. 그래서 도감의 '유형' 값 자체를 이 키워드로 한 번 더 가른다.
*/
const CONFUCIAN_KEYWORDS = ['서원', '향교'];

export function classifyHeritageHouse(title, addr) {
  const text = `${title} ${addr}`;
  return CONFUCIAN_KEYWORDS.some((kw) => text.includes(kw)) ? '서원·향교' : '고택';
}

export const BADGE_RULES = [
  { badge: '세계유산', keywords: ['세계유산', '유네스코', 'UNESCO'] },
  { badge: '국가지정', keywords: ['국보', '보물', '사적', '명승'] },
  { badge: '민속마을', keywords: ['중요민속문화재', '국가민속문화재', '민속마을'] },
  { badge: '공공건축물', keywords: ['주민센터', '도서관', '박물관', '상촌재', '무계원', '공공'] },
  { badge: '조선시대', keywords: ['조선', '이조'] },
  { badge: '궁궐', keywords: ['궁궐', '경복궁', '창덕궁', '덕수궁', '집옥재', '낙선재', '석어당'] },
  { badge: '고택', keywords: ['고택', '종택', '종가', '선교장'] },
  { badge: '서원·향교', keywords: CONFUCIAN_KEYWORDS },
  { badge: '돌담길', keywords: ['돌담', '담장'] },
  { badge: '전통체험', keywords: ['체험', '체험관'] },
];

export function assignBadges(title, addr) {
  const text = `${title} ${addr}`;
  const badges = [];
  for (const rule of BADGE_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      badges.push(rule.badge);
    }
  }
  return badges.slice(0, 3);
}

/** 위경도가 대한민국 영토 범위 안인지. TourAPI가 이따금 0,0이나 다른 나라 좌표를 돌려준다. */
export function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

export function toHttps(url) {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}
