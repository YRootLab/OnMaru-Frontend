/**
 * 지도 공용 지리 계산.
 *
 * 예전에는 거리 계산기가 두 벌이었다 — useKakaoMap은 Haversine, place.service는
 * 위도 37° 고정 평면 근사(경도 1도 = 88,800m)를 썼다. 후자는 제주(33°)에서 5% 넘게
 * 틀리는데 목록 기본 정렬이 '거리순'이라 순서가 어긋났다. 하나로 합친다.
 */

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface LatLngLike {
  lat: number;
  lng: number;
}

/** 두 좌표 사이 대권 거리(m). */
export function distanceInMeters(a: LatLngLike, b: LatLngLike): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface TravelEstimate {
  rawMeters: number;
  distanceStr: string;
  travelTimeStr: string;
  fullLabel: string;
  isFromUserLocation: boolean;
}

/**
 * 사용자 위치(userLocation) 또는 지도 중심(center)을 기준으로
 * 실제 대권 거리(Haversine)와 현실적인 보행/차량 이동 시간을 정밀 계산합니다.
 *
 * 표준 속도 기준:
 * - 보행(도보): 4.0 km/h = 66.7 m/min (카카오맵 / 네이버 지도 보행자 표준)
 *   - 1.5km 이하: "도보 X분" (예: 100m -> 도보 1~2분, 800m -> 도보 12분)
 * - 차량 이동: 시내 교차로/신호 대기 포함 평균 28 km/h = 466 m/min
 *   - 1.5km ~ 35km: "차량 X분" (예: 4.5km -> 차량 10분)
 *   - 35km 초과 장거리: 이동 시간 생략하고 거리만 표시 (예: "내 위치에서 142km")
 */
export function calculateTravelEstimate(
  target?: LatLngLike | null,
  userLocation?: LatLngLike | null,
  mapCenter?: LatLngLike | null,
): TravelEstimate {
  if (!target || typeof target.lat !== 'number' || typeof target.lng !== 'number') {
    return {
      rawMeters: 0,
      distanceStr: '',
      travelTimeStr: '',
      fullLabel: '',
      isFromUserLocation: false,
    };
  }

  // 1. 기준점 선정 (GPS 내 위치 우선, 없을 경우 지도 중심점)
  const isFromUser = Boolean(userLocation);
  const basePoint = userLocation || mapCenter || null;

  if (!basePoint || typeof basePoint.lat !== 'number' || typeof basePoint.lng !== 'number') {
    return {
      rawMeters: 0,
      distanceStr: '',
      travelTimeStr: '',
      fullLabel: '',
      isFromUserLocation: false,
    };
  }

  // 2. 고정밀 대권 거리(m) 계산
  const meters = Math.round(distanceInMeters(basePoint, target));
  const distanceStr = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;

  // 3. 이동 시간 계산 (도보 vs 차량 vs 장거리)
  let travelTimeStr = '';
  if (meters <= 1500) {
    const walkMinutes = Math.max(1, Math.round(meters / 67));
    travelTimeStr = `도보 ${walkMinutes}분`;
  } else if (meters <= 35000) {
    const driveMinutes = Math.max(2, Math.round(meters / 460));
    travelTimeStr = `차량 ${driveMinutes}분`;
  }

  // 4. 출처 텍스트 결합 (내 위치 vs 중심 기준)
  const prefix = isFromUser ? '내 위치에서' : '지도 중심에서';
  let fullLabel = '';
  if (travelTimeStr) {
    fullLabel = `${prefix} ${distanceStr} · ${travelTimeStr}`;
  } else {
    fullLabel = `${prefix} ${distanceStr}`;
  }

  return {
    rawMeters: meters,
    distanceStr,
    travelTimeStr,
    fullLabel,
    isFromUserLocation: isFromUser,
  };
}

/**
 * 정통 한옥·문화재 여부.
 *
 * 예전 정규식은 `당\b|재\b|헌\b` 처럼 한글 뒤에 \b를 붙였다. \b는 ASCII \w 기준이라
 * "명옥헌"처럼 한글로 끝나는 이름에서는 경계가 생기지 않아 한 번도 매치되지 않았다.
 * 접미사는 정규식 대신 "이름이 그 글자로 끝나는가"로 직접 판정한다.
 */
/** 한옥과 무관한 일반 상업·의료·학업·행정 시설 제외 키워드 */
const NON_TRADITIONAL_EXCLUSIONS = [
  '병원', '의원', '약국', '치과', '한의원', '학원', '독서실', '세차', '주차장', '주차',
  '정육', '마트', '슈퍼', '부동산', '공인중개사', '헤어', '미용', '네일',
  '헬스', '피트니스', '필라테스', '스크린', '노래', 'pc방', '세탁', '주유소',
  '카센터', '충전소', '호프', '클럽', '편의점', '모텔', '아파트', '빌라',
  '오피스텔', '주민센터', '행정복지센터', '치안센터', '파출소', '소방서', '우체국',
  '세무서', '구청', '시청', '법원', '식당', '순대', '국밥', '치킨', '피자', '포차',
];

/** 정통 한옥·문화재 명칭 키워드 */
const TRADITIONAL_KEYWORDS = [
  '한옥', '고택', '종택', '향교', '서원', '사당', '궁궐', '성곽', '누각',
  '기와', '초가', '와가', '민속마을', '한옥마을', '선교장', '운조루', '경기전',
  '하회', '양동', '외암', '성읍', '임청각', '부용대', '오죽헌', '화성행궁',
  '창덕궁', '경복궁', '덕수궁', '창경궁', '경희궁', '종묘', '도산서원',
  '병산서원', '소수서원', '옥산서원', '필암서원', '돈암서원', '무성서원',
  '전통한옥', '전통가옥', '전통고택', '전통문화', '전통마을',
];

/** 고택·정자·누각류 전통 접미사 ('원'·'장'·'당'은 병원·세차장·식당 오인 방지를 위해 단독 접미사에서 제외) */
const TRADITIONAL_SUFFIXES = ['헌', '루', '각', '정사', '종택', '고택', '재', '전', '묘'];

/** TourAPI 분류코드 기준 — 고궁/전통건조물/민속마을 계열. */
function isTraditionalCat3(cat3: string): boolean {
  return cat3 === 'B02011600' || cat3 === 'A02080100' || cat3.startsWith('A0201');
}

export function isTraditionalPlace(name: string, cat3 = ''): boolean {
  const title = (name || '').trim();
  if (!title) return false;

  // 1. 일반 상업/의료/편의시설 명칭은 무조건 제외
  if (NON_TRADITIONAL_EXCLUSIONS.some((ex) => title.includes(ex))) {
    return false;
  }

  // 2. 문화재/한옥 공인 분류코드
  if (isTraditionalCat3(cat3)) return true;

  // 3. 정통 한옥/문화재 핵심 키워드 매칭
  if (TRADITIONAL_KEYWORDS.some((keyword) => title.includes(keyword))) return true;

  // 4. 전통 정자·누각·고택 접미사 판별 (명옥헌, 영남루, 광한루, 촉석루 등)
  if (title.length >= 2 && title.length <= 6) {
    if (TRADITIONAL_SUFFIXES.some((suf) => title.endsWith(suf))) {
      return true;
    }
  }

  return false;
}

/**
 * 주소에서 클러스터에 쓸 시·군·구 이름을 뽑는다.
 *
 * 예전에는 /도|시|군|구/g 로 전역 치환해서 "구리시" → "리", "군산시" → "산"이 됐다.
 * 행정 접미사는 문자열 끝에서 한 번만 떼어낸다.
 */
export function shortRegionName(addr: string): string {
  const parts = addr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  // 광역단체(첫 토큰) 다음에 오는 시·군·구가 사람이 부르는 이름이다.
  const candidate = parts.length >= 2 ? parts[1] : parts[0];

  return candidate.replace(/(특별자치도|특별자치시|광역시|특별시|자치시|자치구|시|군|구|도)$/, '')
    || candidate;
}
