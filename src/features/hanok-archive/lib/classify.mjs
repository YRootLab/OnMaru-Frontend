
















export const CATEGORY_MAPPINGS = {
  STAY_HANOK: { contentTypeId: '32', cat1: 'B02', cat2: 'B0201', cat3: 'B02011600' },
  HERITAGE_HOUSE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010400' },
  FOLK_VILLAGE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010600' },
  PALACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010100' },
  BIRTHPLACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010500' },
  GATE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010300' },
};


export const STAY_TYPE = '한옥스테이';





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


export function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

export function toHttps(url) {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}
