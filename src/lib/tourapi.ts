import type { Village, VillageMeta } from '@/hanok/types';

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

export const CATEGORY_MAPPINGS = {
  STAY_HANOK: { contentTypeId: '32', cat1: 'B02', cat2: 'B0201', cat3: 'B02011600' },
  VILLAGE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010800' },
  HERITAGE_HOUSE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010100' },
  PALACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010300' },
};

const AREA_MAP: Record<string, string> = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구', '5': '광주', '6': '부산', '7': '울산', '8': '세종',
  '31': '경기', '32': '강원', '33': '충북', '34': '충남', '35': '경북', '36': '경남', '37': '전북', '38': '전남', '39': '제주',
};

// areacode가 없으면 주소 앞머리로 지역을 잡는데, 그러면 '경상북도' 같은 정식 명칭이 나와
// AREA_MAP 축약형과 섞인다. 지역 필터(지도·스테이)와 모달 서사 템플릿이 모두 축약형 키를
// 쓰므로 여기서 한쪽으로 통일한다.
const REGION_ALIASES: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원',
  충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전북특별자치도: '전북',
  전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주도: '제주', 제주특별자치도: '제주',
};

function resolveRegion(areacode: string, addr: string): string {
  if (AREA_MAP[areacode]) return AREA_MAP[areacode];
  const head = addr.split(' ')[0] ?? '';
  return REGION_ALIASES[head] || head || '기타';
}

const BADGE_RULES = [
  { badge: '세계유산', keywords: ['세계유산', '유네스코', 'UNESCO'] },
  { badge: '국가지정', keywords: ['국보', '보물', '사적', '명승'] },
  { badge: '민속마을', keywords: ['중요민속문화재', '국가민속문화재', '민속마을'] },
  { badge: '공공건축물', keywords: ['주민센터', '도서관', '박물관', '상촌재', '무계원', '공공'] },
  { badge: '조선시대', keywords: ['조선', '이조'] },
  { badge: '궁궐', keywords: ['궁궐', '경복궁', '창덕궁', '덕수궁', '집옥재', '낙선재', '석어당'] },
  { badge: '고택', keywords: ['고택', '종택', '종가', '선교장'] },
  { badge: '서원·향교', keywords: ['서원', '향교'] },
  { badge: '돌담길', keywords: ['돌담', '담장'] },
  { badge: '전통체험', keywords: ['체험', '체험관'] },
];

function toHttps(url?: string | null): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}

function parseBadges(text: string): string[] {
  const hits = new Set<string>();
  for (const { badge, keywords } of BADGE_RULES) {
    if (keywords.some((w) => text.includes(w))) hits.add(badge);
  }
  return Array.from(hits).slice(0, 5);
}

function classifyType(title: string, addr: string, contentTypeId?: string): string {
  if (contentTypeId === '32') return '한옥 고택 스테이';
  const combined = `${title} ${addr}`;
  if (combined.includes('주민센터') || combined.includes('도서관') || combined.includes('박물관') || combined.includes('상촌재') || combined.includes('무계원') || combined.includes('완판본')) {
    return '한옥 공공건축물';
  }
  if (combined.includes('궁') || combined.includes('궁궐') || combined.includes('집옥재') || combined.includes('낙선재') || combined.includes('석어당')) {
    return '궁궐 한옥';
  }
  if (combined.includes('서원') || combined.includes('향교')) {
    return '서원·향교';
  }
  if (combined.includes('고택') || combined.includes('종택') || combined.includes('선교장') || combined.includes('종가')) {
    return '사대부 고택';
  }
  if (combined.includes('서울') || combined.includes('전주') || combined.includes('도심')) {
    return '도심형';
  }
  if (combined.includes('마을') || combined.includes('촌')) {
    return '집성촌형';
  }
  return '체험형';
}

const EXCLUDE_STORE_WORDS = [
  '상점', '카페', '식당', '공방', '베이커리', '빵집', '마트', '슈퍼',
  '부동산', '편의점', '뷰티', '미용', '헤어', '의류', '판매점', '상가',
  '게스트하우스', '펜션', '모텔', '호텔', '리조트', '주차장', '음식점', '점포',
  '한복대여', '렌탈', '렌털', '대여점',
  // 행사·프로그램: 건축물이 아니라 도감에 들어갈 대상이 아니다
  '축제', '퍼레이드', '공연', '대회', '전시회', '플리마켓', '체험행사', '페스티벌',
];

// '한복남 전주한옥마을점'처럼 지점명으로 끝나는 상업 시설
const BRANCH_SUFFIX = /점$/;

// 12=관광지, 14=문화시설, 32=숙박만 남긴다.
// (15=행사/공연/축제, 25=여행코스, 28=레포츠, 38=쇼핑, 39=음식점 제외)
const ALLOWED_CONTENT_TYPES = new Set(['12', '14', '32']);

export async function fetchTourApiRealtime(): Promise<{ villages: Village[]; meta: VillageMeta }> {
  const apiKey = process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.TOUR_API_KEY;

  const FALLBACK_META: VillageMeta = {
    generatedAt: new Date().toISOString(),
    total: 0,
    byType: {},
    imageRate: 0,
    badgeStats: {},
    badgeFallbackCount: 0,
  };

  if (!apiKey) {
    console.warn('[TourAPI Realtime] API 키가 없어 기본 데이터를 리턴합니다.');
    return { villages: [], meta: FALLBACK_META };
  }

  const queryEndpoints = [
    { type: 'keyword', val: '한옥' },
    { type: 'keyword', val: '한옥마을' },
    { type: 'keyword', val: '경복궁' },
    { type: 'keyword', val: '창덕궁' },
    { type: 'keyword', val: '덕수궁' },
    { type: 'keyword', val: '고택' },
    { type: 'keyword', val: '종택' },
    { type: 'keyword', val: '서원' },
    { type: 'keyword', val: '향교' },
    { type: 'keyword', val: '한옥도서관' },
    { type: 'keyword', val: '주민센터' },
    { type: 'keyword', val: '상촌재' },
    { type: 'keyword', val: '무계원' },
    { type: 'cat', val: CATEGORY_MAPPINGS.PALACE },
    { type: 'cat', val: CATEGORY_MAPPINGS.HERITAGE_HOUSE },
    { type: 'cat', val: CATEGORY_MAPPINGS.VILLAGE },
    { type: 'cat', val: CATEGORY_MAPPINGS.STAY_HANOK },
    { type: 'stay', val: '' },
    { type: 'stayKeyword', val: '한옥' },
    { type: 'stayKeyword', val: '고택' },
    { type: 'stayKeyword', val: '한옥스테이' },
  ];

  const byId = new Map<string, Village>();

  for (const q of queryEndpoints) {
    try {
      let url = '';
      if (q.type === 'keyword') {
        url = `${BASE_URL}/searchKeyword2?serviceKey=${encodeURIComponent(apiKey)}&MobileOS=ETC&MobileApp=OnMaru&_type=json&keyword=${encodeURIComponent(q.val as string)}&numOfRows=30&arrange=C`;
      } else if (q.type === 'stay') {
        url = `${BASE_URL}/searchStay2?serviceKey=${encodeURIComponent(apiKey)}&MobileOS=ETC&MobileApp=OnMaru&_type=json&hanok=1&numOfRows=50&arrange=C`;
      } else if (q.type === 'stayKeyword') {
        url = `${BASE_URL}/searchKeyword2?serviceKey=${encodeURIComponent(apiKey)}&MobileOS=ETC&MobileApp=OnMaru&_type=json&keyword=${encodeURIComponent(q.val as string)}&contentTypeId=32&numOfRows=40&arrange=C`;
      } else {
        const cat = q.val as any;
        url = `${BASE_URL}/areaBasedList2?serviceKey=${encodeURIComponent(apiKey)}&MobileOS=ETC&MobileApp=OnMaru&_type=json&contentTypeId=${cat.contentTypeId}&cat1=${cat.cat1}&cat2=${cat.cat2}&cat3=${cat.cat3}&numOfRows=40&arrange=C`;
      }

      const res = await fetch(url, { next: { revalidate: 3600 } });
      const json = await res.json();
      const rawItems = json?.response?.body?.items?.item;
      const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

      for (const item of items) {
        const id = String(item.contentid ?? '');
        if (!id || byId.has(id)) continue;

        const contentTypeId = String(item.contenttypeid ?? '');
        if (!ALLOWED_CONTENT_TYPES.has(contentTypeId)) continue;

        const title = String(item.title ?? '').trim();
        if (EXCLUDE_STORE_WORDS.some((w) => title.includes(w))) continue;
        if (BRANCH_SUFFIX.test(title)) continue;

        const addr = String(item.addr1 ?? '').trim();
        const areacode = String(item.areacode ?? '');
        const region = resolveRegion(areacode, addr);
        const img = toHttps(item.firstimage || item.firstimage2);
        const lat = Number(item.mapy);
        const lng = Number(item.mapx);

        // searchKeyword2/areaBasedList2는 overview를 주지 않는다. 예전엔 `제목 — 주소`로
        // 채웠는데 카드마다 제목이 두 번 나오는 죽은 카피가 됐다. 없으면 비워 두고,
        // 상세 설명은 모달이 detailCommon2로 따로 가져온다.
        const overview = String(item.overview ?? '').trim();
        const badges = parseBadges(`${title} ${addr} ${overview}`);

        byId.set(id, {
          id,
          name: title.replace(/\[[^\]]*\]/g, '').trim(),
          rawTitle: title,
          region,
          addr,
          lat: Number.isFinite(lat) ? lat : null,
          lng: Number.isFinite(lng) ? lng : null,
          type: classifyType(title, addr, contentTypeId) as any,
          badges,
          image: img,
          hasImage: Boolean(img),
          summary: overview.length > 60 ? `${overview.slice(0, 59)}…` : overview,
          overview,
        });
      }
    } catch (err) {
      console.warn(`[TourAPI Realtime] ${q.type}:${JSON.stringify(q.val)} 호출 실패`, err);
    }
  }

  const villages = Array.from(byId.values());

  const byType: Record<string, number> = {};
  for (const v of villages) {
    byType[v.type] = (byType[v.type] || 0) + 1;
  }

  return {
    villages,
    meta: {
      generatedAt: new Date().toISOString(),
      total: villages.length,
      byType,
      imageRate: villages.filter((v) => v.hasImage).length / (villages.length || 1),
      badgeStats: {},
      badgeFallbackCount: 0,
    },
  };
}
