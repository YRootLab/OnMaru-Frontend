/**
 * VisitorService가 반환하는 시군구명 → 소리마루 검색 키워드 매핑.
 *
 * DataLab 시군구명(signguNm)이 키다. 한국관광공사 Odii API가 키워드 검색을 지원하므로
 * 장소 대표명을 넘기면 해당 지역 오디오 트랙을 찾아준다.
 *
 * 트랙 coverage가 없는 시군구는 여기에 넣지 않는다 — 없는 지역을 넣으면
 * getFirstStoryByKeyword가 관련 없는 트랙을 반환할 수 있다.
 */
export interface RegionSoundEntry {
  /** 소리마루 API에 넘길 검색 키워드 */
  keyword: string;
  /** 홈 피드에 표시할 사람이 읽을 수 있는 지역명 */
  displayName: string;
}

export const REGION_KEYWORD_MAP: Record<string, RegionSoundEntry> = {
  // 서울
  종로구: { keyword: '북촌', displayName: '서울 북촌' },
  // 경상북도
  안동시: { keyword: '하회마을', displayName: '안동 하회마을' },
  경주시: { keyword: '교촌마을', displayName: '경주 교촌' },
  // 전라북도
  전주시완산구: { keyword: '전주한옥마을', displayName: '전주 한옥마을' },
  전주시: { keyword: '전주한옥마을', displayName: '전주 한옥마을' },
  // 강원도
  강릉시: { keyword: '선교장', displayName: '강릉 선교장' },
  // 제주
  제주시: { keyword: '성읍민속마을', displayName: '제주 성읍마을' },
  서귀포시: { keyword: '제주', displayName: '서귀포' },
  // 충청남도
  부여군: { keyword: '백제문화단지', displayName: '부여' },
  공주시: { keyword: '공주', displayName: '공주' },
  // 경기도
  수원시: { keyword: '수원화성', displayName: '수원 화성' },
  // 전라남도
  순천시: { keyword: '낙안읍성', displayName: '순천 낙안읍성' },
  담양군: { keyword: '담양', displayName: '담양' },
  // 경상남도
  하동군: { keyword: '하동', displayName: '하동' },
  통영시: { keyword: '통영', displayName: '통영' },
  // 충청북도
  충주시: { keyword: '충주', displayName: '충주' },
};

/** DataLab signguNm에서 매핑 항목을 찾는다. 없으면 null. */
export function findRegionEntry(signguNm: string): RegionSoundEntry | null {
  // 정확 일치 먼저
  if (REGION_KEYWORD_MAP[signguNm]) return REGION_KEYWORD_MAP[signguNm];

  // 시군구명 앞부분으로 부분 일치 (예: "전주시 완산구" → "전주시완산구")
  const normalized = signguNm.replace(/\s/g, '');
  if (REGION_KEYWORD_MAP[normalized]) return REGION_KEYWORD_MAP[normalized];

  // 시/군/구명에서 접두어 매칭 (예: "안동시" → "안동시")
  for (const key of Object.keys(REGION_KEYWORD_MAP)) {
    if (signguNm.startsWith(key) || key.startsWith(signguNm)) {
      return REGION_KEYWORD_MAP[key];
    }
  }

  return null;
}
