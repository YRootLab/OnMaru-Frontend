







const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface LatLngLike {
  lat: number;
  lng: number;
}


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


  const meters = Math.round(distanceInMeters(basePoint, target));
  const distanceStr = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;


  let travelTimeStr = '';
  if (meters <= 1500) {
    const walkMinutes = Math.max(1, Math.round(meters / 67));
    travelTimeStr = `도보 ${walkMinutes}분`;
  } else if (meters <= 35000) {
    const driveMinutes = Math.max(2, Math.round(meters / 460));
    travelTimeStr = `차량 ${driveMinutes}분`;
  }


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









const NON_TRADITIONAL_EXCLUSIONS = [
  '병원', '의원', '약국', '치과', '한의원', '학원', '독서실', '세차', '주차장', '주차',
  '정육', '마트', '슈퍼', '부동산', '공인중개사', '헤어', '미용', '네일',
  '헬스', '피트니스', '필라테스', '스크린', '노래', 'pc방', '세탁', '주유소',
  '카센터', '충전소', '호프', '클럽', '편의점', '모텔', '아파트', '빌라',
  '오피스텔', '주민센터', '행정복지센터', '치안센터', '파출소', '소방서', '우체국',
  '세무서', '구청', '시청', '법원', '식당', '순대', '국밥', '치킨', '피자', '포차',
];


const TRADITIONAL_KEYWORDS = [
  '한옥', '고택', '종택', '향교', '서원', '사당', '궁궐', '성곽', '누각',
  '기와', '초가', '와가', '민속마을', '한옥마을', '선교장', '운조루', '경기전',
  '하회', '양동', '외암', '성읍', '임청각', '부용대', '오죽헌', '화성행궁',
  '창덕궁', '경복궁', '덕수궁', '창경궁', '경희궁', '종묘', '도산서원',
  '병산서원', '소수서원', '옥산서원', '필암서원', '돈암서원', '무성서원',
  '전통한옥', '전통가옥', '전통고택', '전통문화', '전통마을',
];


const TRADITIONAL_SUFFIXES = ['헌', '루', '각', '정사', '종택', '고택', '재', '전', '묘'];


function isTraditionalCat3(cat3: string): boolean {
  return cat3 === 'B02011600' || cat3 === 'A02080100' || cat3.startsWith('A0201');
}

export function isTraditionalPlace(name: string, cat3 = ''): boolean {
  const title = (name || '').trim();
  if (!title) return false;


  if (NON_TRADITIONAL_EXCLUSIONS.some((ex) => title.includes(ex))) {
    return false;
  }


  if (isTraditionalCat3(cat3)) return true;


  if (TRADITIONAL_KEYWORDS.some((keyword) => title.includes(keyword))) return true;


  if (title.length >= 2 && title.length <= 6) {
    if (TRADITIONAL_SUFFIXES.some((suf) => title.endsWith(suf))) {
      return true;
    }
  }

  return false;
}







export function shortRegionName(addr: string): string {
  const parts = addr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';


  const candidate = parts.length >= 2 ? parts[1] : parts[0];

  return candidate.replace(/(특별자치도|특별자치시|광역시|특별시|자치시|자치구|시|군|구|도)$/, '')
    || candidate;
}
