// KorService2 TourAPI 공통 API 호출 모듈
// 환경변수 TOUR_API_KEY 또는 NEXT_PUBLIC_TOUR_API_KEY 사용
import { URLSearchParams } from 'node:url';

const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const WARN_THRESHOLD = 900;
const HALT_THRESHOLD = 950;
const RETRY_DELAYS = [500, 1500];

let totalCalls = 0;
const countsByEndpoint = {};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** TourAPI 호출 통계 및 한도 모니터링 정보 반환 */
export function getCallStats() {
  return {
    totalCalls,
    countsByEndpoint: { ...countsByEndpoint },
  };
}

/** TourAPI HTML/BR 태그 및 엔티티 정제 레퍼 */
export function stripTags(s) {
  return String(s ?? '')
    .replace(/<\s*(br|\/p|\/div|\/li)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** API 응답 JSON에서 items 배열을 안전하게 추출 */
export function itemsOf(json) {
  const item = json?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/** API 응답 totalCount 추출 */
export function totalOf(json) {
  return Number(json?.response?.body?.totalCount ?? 0) || 0;
}

/**
 * KorService2 엔드포인트 공통 fetch 함수
 * @param {string} endpoint - API 엔드포인트명 (예: 'searchKeyword2')
 * @param {Record<string, string>} params - 쿼리 파라미터
 */
export async function callApi(endpoint, params = {}) {
  const key = process.env.TOUR_API_KEY ?? process.env.NEXT_PUBLIC_TOUR_API_KEY;
  if (!key) {
    throw new Error('TOUR_API_KEY 또는 NEXT_PUBLIC_TOUR_API_KEY가 설정되어 있지 않습니다.');
  }

  // 950회 도달 시 해당 엔드포인트 차단
  if (totalCalls >= HALT_THRESHOLD) {
    console.warn(`[TourAPI] 🚨 일일 호출 임계치(${HALT_THRESHOLD}회) 도달! '${endpoint}' 호출을 중단합니다.`);
    return null;
  }

  // 엔드포인트별 카운터
  countsByEndpoint[endpoint] = (countsByEndpoint[endpoint] ?? 0) + 1;
  totalCalls++;

  if (totalCalls === WARN_THRESHOLD) {
    console.warn(`[TourAPI] ⚠️ 호출 경고: 현재 총 ${totalCalls}회 호출되었습니다. (한도 1,000회 직전)`);
  }

  // 호출 간 200ms 딜레이
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

/**
 * 1. 키워드 검색 — 마을/한옥 수집
 * @param {string} keyword
 * @param {Record<string, any>} [opts]
 */
export async function searchKeyword(keyword, opts = {}) {
  return callApi('searchKeyword2', {
    keyword,
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.contentTypeId ? { contentTypeId: String(opts.contentTypeId) } : {}),
    ...opts.extraParams,
  });
}

/**
 * 2. 숙박 전용 검색 — 한옥 숙소 수집
 * @param {Record<string, any>} [opts]
 */
export async function searchStay(opts = {}) {
  return callApi('searchStay2', {
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.hanok ? { hanok: String(opts.hanok) } : {}),
    ...opts.extraParams,
  });
}

/**
 * 3. 공통정보 — 개요·좌표·주소·대표이미지
 * @param {string} contentId
 * @param {Record<string, any>} [opts]
 */
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

/**
 * 4. 이미지 목록 — firstimage 없을 때 폴백, 공공누리 저작권 유형 포함
 * @param {string} contentId
 * @param {Record<string, any>} [opts]
 */
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

/**
 * 5. 소개정보 — 숙박 시설정보(체크인/주차/취사 등)
 * @param {string} contentId
 * @param {string|number} contentTypeId
 */
export async function detailIntro(contentId, contentTypeId) {
  return callApi('detailIntro2', {
    contentId: String(contentId),
    contentTypeId: String(contentTypeId),
  });
}

/**
 * 6. 반복정보 — 이용안내, 추가 상세
 * @param {string} contentId
 * @param {string|number} contentTypeId
 */
export async function detailInfo(contentId, contentTypeId) {
  return callApi('detailInfo2', {
    contentId: String(contentId),
    contentTypeId: String(contentTypeId),
  });
}

/**
 * 7. 위치기반 — 주변 관광지/음식점/숙박
 * @param {number|string} mapx
 * @param {number|string} mapy
 * @param {number|string} [radius=3000]
 * @param {number|string} [contentTypeId='']
 * @param {Record<string, any>} [opts]
 */
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

/**
 * 8. 행사 — 이 달의 축제
 * @param {string} eventStartDate - YYYYMM01 형식
 * @param {Record<string, any>} [opts]
 */
export async function searchFestival(eventStartDate, opts = {}) {
  return callApi('searchFestival2', {
    eventStartDate: String(eventStartDate),
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.areaCode ? { areaCode: String(opts.areaCode) } : {}),
    ...opts.extraParams,
  });
}

/**
 * 9. 반려동물 동반 정보
 * @param {string} contentId
 */
export async function detailPetTour(contentId) {
  return callApi('detailPetTour2', {
    contentId: String(contentId),
  });
}

/**
 * 10. 법정동 코드 — 지역 필터용
 * @param {Record<string, any>} [opts]
 */
export async function ldongCode(opts = {}) {
  return callApi('ldongCode2', {
    numOfRows: String(opts.numOfRows ?? 100),
    pageNo: String(opts.pageNo ?? 1),
    ...(opts.lDongCd ? { lDongCd: String(opts.lDongCd) } : {}),
    ...opts.extraParams,
  });
}
