

import { URLSearchParams } from 'node:url';

const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const WARN_THRESHOLD = 900;
const HALT_THRESHOLD = 950;
const RETRY_DELAYS = [500, 1500];

let totalCalls = 0;
const countsByEndpoint = {};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


export function getCallStats() {
  return {
    totalCalls,
    countsByEndpoint: { ...countsByEndpoint },
  };
}


export function stripTags(s) {
  return String(s ?? '')
    .replace(/<\s*(br|\/p|\/div|\/li)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}






export function toHttps(url) {
  const s = String(url ?? '').trim();
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}


export function itemsOf(json) {
  const item = json?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}


export function totalOf(json) {
  return Number(json?.response?.body?.totalCount ?? 0) || 0;
}






export async function callApi(endpoint, params = {}) {
  const key = process.env.TOUR_API_KEY ?? process.env.NEXT_PUBLIC_TOUR_API_KEY;
  if (!key) {
    throw new Error('TOUR_API_KEY 또는 NEXT_PUBLIC_TOUR_API_KEY가 설정되어 있지 않습니다.');
  }


  if (totalCalls >= HALT_THRESHOLD) {
    console.warn(`[TourAPI] 🚨 일일 호출 임계치(${HALT_THRESHOLD}회) 도달! '${endpoint}' 호출을 중단합니다.`);
    return null;
  }


  countsByEndpoint[endpoint] = (countsByEndpoint[endpoint] ?? 0) + 1;
  totalCalls++;

  if (totalCalls === WARN_THRESHOLD) {
    console.warn(`[TourAPI] ⚠️ 호출 경고: 현재 총 ${totalCalls}회 호출되었습니다. (한도 1,000회 직전)`);
  }


  await sleep(200);

  const queryParams = {
    MobileOS: 'ETC',
    MobileApp: 'OnMaru',
    _type: 'json',
    ...params,
  };

  const rest = new URLSearchParams(queryParams).toString();
  const urls = [
    `${BASE}/${endpoint}?serviceKey=${encodeURIComponent(key)}&${rest}`,
    `${BASE}/${endpoint}?serviceKey=${key}&${rest}`,
  ];

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch(urls[attempt % urls.length]);
      const text = await res.text();
      if (!text.trim().startsWith('{')) {
        throw new Error(`non-JSON 응답: ${text.slice(0, 120).replace(/\s+/g, ' ')}`);
      }
      const json = JSON.parse(text);
      const { resultCode, resultMsg } = json?.response?.header ?? {};
      if (resultCode && resultCode !== '0000') {
        throw new Error(`TourAPI Error (${resultCode}): ${resultMsg}`);
      }
      return json;
    } catch (err) {
      if (attempt < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt];
        console.warn(`  ! [${endpoint}] 호출 실패 (${err.message}) → ${delay}ms 후 재시도 (${attempt + 1}/${RETRY_DELAYS.length})`);
        await sleep(delay);
      } else {
        console.error(`  ❌ [${endpoint}] 최종 호출 실패: ${err.message}`);
        throw err;
      }
    }
  }
  return null;
}






export async function searchKeyword(keyword, opts = {}) {
  return callApi('searchKeyword2', {
    keyword,
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.contentTypeId ? { contentTypeId: String(opts.contentTypeId) } : {}),
    ...opts.extraParams,
  });
}





export async function searchStay(opts = {}) {
  return callApi('searchStay2', {
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.hanok ? { hanok: String(opts.hanok) } : {}),
    ...opts.extraParams,
  });
}






export async function detailCommon(contentId, opts = {}) {
  let json = await callApi('detailCommon2', {
    contentId: String(contentId),
    ...opts.extraParams,
  });
  const firstItem = itemsOf(json)[0];
  if (!firstItem || firstItem.overview === undefined) {
    json = await callApi('detailCommon2', {
      contentId: String(contentId),
      defaultYN: opts.defaultYN ?? 'Y',
      firstImageYN: opts.firstImageYN ?? 'Y',
      overviewYN: opts.overviewYN ?? 'Y',
      mapinfoYN: opts.mapinfoYN ?? 'Y',
      addrinfoYN: opts.addrinfoYN ?? 'Y',
      ...opts.extraParams,
    });
  }
  return json;
}






export async function detailImage(contentId, opts = {}) {
  return callApi('detailImage2', {
    contentId: String(contentId),
    imageYN: opts.imageYN ?? 'Y',
    subImageYN: opts.subImageYN ?? 'Y',
    numOfRows: String(opts.numOfRows ?? 10),
    pageNo: String(opts.pageNo ?? 1),
    ...opts.extraParams,
  });
}






export async function detailIntro(contentId, contentTypeId) {
  return callApi('detailIntro2', {
    contentId: String(contentId),
    contentTypeId: String(contentTypeId),
  });
}






export async function detailInfo(contentId, contentTypeId) {
  return callApi('detailInfo2', {
    contentId: String(contentId),
    contentTypeId: String(contentTypeId),
  });
}









export async function locationBased(mapx, mapy, radius = 3000, contentTypeId = '', opts = {}) {
  return callApi('locationBasedList2', {
    mapX: String(mapx),
    mapY: String(mapy),
    radius: String(radius),
    ...(contentTypeId ? { contentTypeId: String(contentTypeId) } : {}),
    numOfRows: String(opts.numOfRows ?? 10),
    pageNo: String(opts.pageNo ?? 1),
    ...opts.extraParams,
  });
}






export async function searchFestival(eventStartDate, opts = {}) {
  return callApi('searchFestival2', {
    eventStartDate: String(eventStartDate),
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.areaCode ? { areaCode: String(opts.areaCode) } : {}),
    ...opts.extraParams,
  });
}





export async function detailPetTour(contentId) {
  return callApi('detailPetTour2', {
    contentId: String(contentId),
  });
}





export async function ldongCode(opts = {}) {
  return callApi('ldongCode2', {
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.lDongCd ? { lDongCd: String(opts.lDongCd) } : {}),
    ...opts.extraParams,
  });
}





export async function areaBasedList(opts = {}) {
  return callApi('areaBasedList2', {
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    arrange: opts.arrange ?? 'C',
    ...(opts.contentTypeId ? { contentTypeId: String(opts.contentTypeId) } : {}),
    ...(opts.areaCode ? { areaCode: String(opts.areaCode) } : {}),
    ...(opts.cat1 ? { cat1: String(opts.cat1) } : {}),
    ...(opts.cat2 ? { cat2: String(opts.cat2) } : {}),
    ...(opts.cat3 ? { cat3: String(opts.cat3) } : {}),
    ...opts.extraParams,
  });
}





export const CATEGORY_MAPPINGS = {
  STAY_HANOK: { contentTypeId: '32', cat1: 'B02', cat2: 'B0201', cat3: 'B02011600' },
  VILLAGE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010800' },
  HERITAGE_HOUSE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010100' },
  PALACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010300' },
};

export const AREA_CODES = {
  서울: '1', 인천: '2', 대전: '3', 대구: '4', 광주: '5', 부산: '6', 울산: '7', 세종: '8',
  경기: '31', 강원: '32', 충북: '33', 충남: '34', 전북: '35', 전남: '36', 경북: '37', 경남: '38', 제주: '39',
};





export function parseHanokQuery(naturalLanguagePrompt) {
  const prompt = String(naturalLanguagePrompt ?? '');
  let areaCode;
  for (const [region, code] of Object.entries(AREA_CODES)) {
    if (prompt.includes(region)) {
      areaCode = code;
      break;
    }
  }

  let catConfig = CATEGORY_MAPPINGS.VILLAGE;
  if (prompt.includes('숙소') || prompt.includes('숙박') || prompt.includes('스테이') || prompt.includes('민박')) {
    catConfig = CATEGORY_MAPPINGS.STAY_HANOK;
  } else if (prompt.includes('궁') || prompt.includes('궁궐') || prompt.includes('성') || prompt.includes('관아')) {
    catConfig = CATEGORY_MAPPINGS.PALACE;
  } else if (prompt.includes('고택') || prompt.includes('종택') || prompt.includes('생가')) {
    catConfig = CATEGORY_MAPPINGS.HERITAGE_HOUSE;
  }

  const isKeywordSearch = prompt.includes('검색') || (!areaCode && !prompt.includes('한옥') && !prompt.includes('마을'));

  return {
    endpoint: isKeywordSearch ? 'searchKeyword1' : 'areaBasedList1',
    queryParams: {
      ...(isKeywordSearch ? { keyword: prompt } : {}),
      contentTypeId: catConfig.contentTypeId,
      ...(areaCode ? { areaCode } : {}),
      cat1: catConfig.cat1,
      cat2: catConfig.cat2,
      cat3: catConfig.cat3,
      arrange: 'C',
      numOfRows: 20,
    },
  };
}
