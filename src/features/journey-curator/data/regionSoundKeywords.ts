








export interface RegionSoundEntry {

  keyword: string;

  displayName: string;
}

export const REGION_KEYWORD_MAP: Record<string, RegionSoundEntry> = {

  종로구: { keyword: '북촌', displayName: '서울 북촌' },

  안동시: { keyword: '하회마을', displayName: '안동 하회마을' },
  경주시: { keyword: '교촌마을', displayName: '경주 교촌' },

  전주시완산구: { keyword: '전주한옥마을', displayName: '전주 한옥마을' },
  전주시: { keyword: '전주한옥마을', displayName: '전주 한옥마을' },

  강릉시: { keyword: '선교장', displayName: '강릉 선교장' },

  제주시: { keyword: '성읍민속마을', displayName: '제주 성읍마을' },
  서귀포시: { keyword: '제주', displayName: '서귀포' },

  부여군: { keyword: '백제문화단지', displayName: '부여' },
  공주시: { keyword: '공주', displayName: '공주' },

  수원시: { keyword: '수원화성', displayName: '수원 화성' },

  순천시: { keyword: '낙안읍성', displayName: '순천 낙안읍성' },
  담양군: { keyword: '담양', displayName: '담양' },

  하동군: { keyword: '하동', displayName: '하동' },
  통영시: { keyword: '통영', displayName: '통영' },

  충주시: { keyword: '충주', displayName: '충주' },
};


export function findRegionEntry(signguNm: string): RegionSoundEntry | null {

  if (REGION_KEYWORD_MAP[signguNm]) return REGION_KEYWORD_MAP[signguNm];


  const normalized = signguNm.replace(/\s/g, '');
  if (REGION_KEYWORD_MAP[normalized]) return REGION_KEYWORD_MAP[normalized];


  for (const key of Object.keys(REGION_KEYWORD_MAP)) {
    if (signguNm.startsWith(key) || key.startsWith(signguNm)) {
      return REGION_KEYWORD_MAP[key];
    }
  }

  return null;
}
