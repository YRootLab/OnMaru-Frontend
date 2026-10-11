import type {
  DiscoveryTopic,
  DiscoveryPlaceSummary,
  DiscoveryPlaceDetail,
  WorkSummary,
  WorkDetail,
  KContentRelation,
  DiscoveryPlacesPage,
  DiscoveryWorksPage,
  KContentsPage,
  DiscoveryPlacesParams,
  DiscoveryWorksParams,
  TopicCode,
} from '../domain/types';

export const FIXTURE_TOPICS: DiscoveryTopic[] = [
  {
    code: 'TRADITIONAL_SPACE_HERITAGE',
    labelKo: '전통 공간·문화유산',
    labelEn: 'Traditional Spaces & Heritage',
    placeCount: 128,
    active: true,
  },
  {
    code: 'TRADITIONAL_EXPERIENCE',
    labelKo: '전통 체험·공방',
    labelEn: 'Traditional Experience',
    placeCount: 56,
    active: true,
  },
  {
    code: 'TRADITIONAL_FOOD_TEA',
    labelKo: '전통 음식·다례',
    labelEn: 'Traditional Food & Tea',
    placeCount: 43,
    active: true,
  },
  {
    code: 'K_DRAMA',
    labelKo: 'K-드라마',
    labelEn: 'K-Drama',
    placeCount: 92,
    active: true,
  },
  {
    code: 'K_MOVIE',
    labelKo: 'K-영화',
    labelEn: 'K-Movie',
    placeCount: 64,
    active: true,
  },
  {
    code: 'K_POP_MV',
    labelKo: 'K-POP MV',
    labelEn: 'K-POP Music Video',
    placeCount: 38,
    active: true,
  },
];

const FIXTURE_PLACES: DiscoveryPlaceSummary[] = [
  {
    placeId: 'p-gyeongbok',
    name: '경복궁',
    region: { code: '11', nameKo: '서울' },
    placeRoles: [{ code: 'PALACE', labelKo: '궁궐' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_DRAMA'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/64/1939964_image2_1.jpg',
    odiiLinked: true,
    featuredRelation: {
      relationId: 'r-gyeongbok-kingdom',
      workId: 'w-kingdom',
      workTitle: '킹덤',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 4,
    saveAvailable: true,
    savedByMe: false,
  },
  {
    placeId: 'p-changdeok',
    name: '창덕궁 후원',
    region: { code: '11', nameKo: '서울' },
    placeRoles: [{ code: 'PALACE', labelKo: '궁궐' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_DRAMA'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/43/2408643_image2_1.jpg',
    odiiLinked: true,
    featuredRelation: {
      relationId: 'r-changdeok-jewel',
      workId: 'w-jewel-palace',
      workTitle: '대장금',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 6,
    saveAvailable: true,
    savedByMe: false,
  },
  {
    placeId: 'p-andong-hahoe',
    name: '안동 하회마을',
    region: { code: '47', nameKo: '경북' },
    placeRoles: [{ code: 'FOLK_VILLAGE', labelKo: '민속마을' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_DRAMA', 'K_MOVIE'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/82/2567982_image2_1.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-hahoe-mr-sunshine',
      workId: 'w-mr-sunshine',
      workTitle: '미스터 션샤인',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 3,
    saveAvailable: true,
    savedByMe: true,
  },
  {
    placeId: 'p-jeonju-hanok',
    name: '전주 한옥마을',
    region: { code: '45', nameKo: '전북' },
    placeRoles: [{ code: 'HANOK_VILLAGE', labelKo: '한옥마을' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'TRADITIONAL_EXPERIENCE', 'K_DRAMA'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/14/2633914_image2_1.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-jeonju-rookie',
      workId: 'w-rookie-historian',
      workTitle: '신입사관 구해령',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 5,
    saveAvailable: true,
    savedByMe: false,
  },
  {
    placeId: 'p-namhansanseong',
    name: '남한산성',
    region: { code: '41', nameKo: '경기' },
    placeRoles: [{ code: 'FORTRESS', labelKo: '산성·요새' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_MOVIE'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/00/2643200_image2_1.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-namhan-siege',
      workId: 'w-siege-namhansanseong',
      workTitle: '남한산성',
      type: 'MOVIE',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 2,
    saveAvailable: true,
    savedByMe: false,
  },
  {
    placeId: 'p-gwanghanru',
    name: '남원 광한루원',
    region: { code: '45', nameKo: '전북' },
    placeRoles: [{ code: 'GARDEN', labelKo: '정원·누각' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_DRAMA'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/32/2612132_image2_1.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-gwanghanru-seonjwa',
      workId: 'w-seonjwa',
      workTitle: '슈룹',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 2,
    saveAvailable: true,
    savedByMe: false,
  },
  {
    placeId: 'p-manhyujeong',
    name: '안동 만휴정',
    region: { code: '47', nameKo: '경북' },
    placeRoles: [{ code: 'PAVILION', labelKo: '정자' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_DRAMA'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-manhyujeong-mr-sunshine',
      workId: 'w-mr-sunshine',
      workTitle: '미스터 션샤인',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 1,
    saveAvailable: true,
    savedByMe: false,
  },
  {
    placeId: 'p-awon',
    name: '완주 아원고택',
    region: { code: '45', nameKo: '전북' },
    placeRoles: [{ code: 'HISTORIC_HOUSE', labelKo: '고택' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_POP_MV'],
    placeImage: 'https://tong.visitkorea.or.kr/cms/resource/97/2641097_image2_1.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-awon-bts',
      workId: 'w-bts-summer',
      workTitle: 'BTS Summer Package 2019',
      type: 'MUSIC_VIDEO',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 1,
    saveAvailable: true,
    savedByMe: false,
  },
];

const FIXTURE_PLACE_DETAILS: Record<string, DiscoveryPlaceDetail> = {
  'p-gyeongbok': {
    placeId: 'p-gyeongbok',
    name: '경복궁',
    region: { code: '11', nameKo: '서울' },
    address: '서울특별시 종로구 사직로 161',
    coordinates: { latitude: 37.5796, longitude: 126.977 },
    description:
      '조선 왕조 최초의 정궁으로 1395년 창건되었습니다. 근정전, 경회루, 향원정 등 아름다운 전각이 웅장한 북악산을 배경으로 펼쳐집니다. 유네스코 세계유산을 다수 보유한 조선 왕실 문화의 중심지입니다.',
    sourceTaxonomy: {
      provider: 'TOUR_API',
      lclsSystm2: 'HS01',
      lclsSystm3: null,
      labelKo: '역사유적지',
    },
    placeRoles: [{ code: 'PALACE', labelKo: '궁궐' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_DRAMA'],
    images: ['https://tong.visitkorea.or.kr/cms/resource/64/1939964_image2_1.jpg'],
    odii: { linked: true, storyCount: 3 },
    kContents: { relationCount: 4, href: '/api/v1/places/p-gyeongbok/k-contents' },
    saveAvailable: true,
    savedByMe: false,
  },
  'p-andong-hahoe': {
    placeId: 'p-andong-hahoe',
    name: '안동 하회마을',
    region: { code: '47', nameKo: '경북' },
    address: '경상북도 안동시 풍천면 전서로 186',
    coordinates: { latitude: 36.5366, longitude: 128.5215 },
    description:
      '낙동강이 마을을 S자 모양으로 감싸 돌아 하회(河回)라 불리는 전통마을입니다. 풍산 류씨가 600여 년간 집성촌을 이루며 살아온 곳으로, 유네스코 세계문화유산으로 등재되었습니다.',
    sourceTaxonomy: {
      provider: 'TOUR_API',
      lclsSystm2: 'CT01',
      lclsSystm3: null,
      labelKo: '민속마을',
    },
    placeRoles: [{ code: 'FOLK_VILLAGE', labelKo: '민속마을' }],
    topics: ['TRADITIONAL_SPACE_HERITAGE', 'K_DRAMA', 'K_MOVIE'],
    images: ['https://tong.visitkorea.or.kr/cms/resource/82/2567982_image2_1.jpg'],
    odii: { linked: false, storyCount: 0 },
    kContents: { relationCount: 3, href: '/api/v1/places/p-andong-hahoe/k-contents' },
    saveAvailable: true,
    savedByMe: true,
  },
};

const FIXTURE_WORKS: WorkSummary[] = [
  {
    workId: 'w-kingdom',
    canonicalTitle: '킹덤',
    englishTitle: 'Kingdom',
    type: 'DRAMA',
    releaseYear: 2019,
    artists: [],
    workArtwork: null,
    publicPlaceCount: 5,
    workTags: ['사극', '조선', '좀비'],
  },
  {
    workId: 'w-mr-sunshine',
    canonicalTitle: '미스터 션샤인',
    englishTitle: 'Mr. Sunshine',
    type: 'DRAMA',
    releaseYear: 2018,
    artists: [],
    workArtwork: null,
    publicPlaceCount: 8,
    workTags: ['구한말', '사극', '로맨스'],
  },
  {
    workId: 'w-jewel-palace',
    canonicalTitle: '대장금',
    englishTitle: 'Jewel in the Palace',
    type: 'DRAMA',
    releaseYear: 2003,
    artists: [],
    workArtwork: null,
    publicPlaceCount: 6,
    workTags: ['조선', '궁중', '한식'],
  },
  {
    workId: 'w-siege-namhansanseong',
    canonicalTitle: '남한산성',
    englishTitle: 'The Fortress',
    type: 'MOVIE',
    releaseYear: 2017,
    artists: [],
    workArtwork: null,
    publicPlaceCount: 3,
    workTags: ['병자호란', '조선', '역사'],
  },
  {
    workId: 'w-bts-summer',
    canonicalTitle: 'BTS Summer Package 2019',
    englishTitle: 'BTS Summer Package 2019',
    type: 'MUSIC_VIDEO',
    releaseYear: 2019,
    artists: [{ artistId: 'a-bts', name: 'BTS (방탄소년단)' }],
    workArtwork: null,
    publicPlaceCount: 2,
    workTags: ['K-POP', '한옥'],
  },
  {
    workId: 'w-seonjwa',
    canonicalTitle: '슈룹',
    englishTitle: 'Under the Queen\'s Umbrella',
    type: 'DRAMA',
    releaseYear: 2022,
    artists: [],
    workArtwork: null,
    publicPlaceCount: 4,
    workTags: ['조선', '왕실', '정치'],
  },
];

const FIXTURE_WORK_DETAILS: Record<string, WorkDetail> = {
  'w-kingdom': {
    workId: 'w-kingdom',
    canonicalTitle: '킹덤',
    englishTitle: 'Kingdom',
    type: 'DRAMA',
    releaseYear: 2019,
    artists: [],
    workArtwork: null,
    publicPlaceCount: 5,
    workTags: ['사극', '조선', '좀비'],
    summaryPoints: [
      '조선 왕조를 배경으로 한 넷플릭스 오리지널 좀비 사극 시리즈입니다.',
      '세자 이창이 왕의 죽음을 둘러싼 음모와 전염병의 비밀을 파헤치는 이야기입니다.',
      '경복궁, 수원화성 등 실제 조선 시대 유적지를 주요 촬영지로 활용했습니다.',
    ],
    officialPageUrl: null,
    metadataSources: [],
    placesHref: '/api/v1/discovery/places?workId=w-kingdom',
  },
  'w-mr-sunshine': {
    workId: 'w-mr-sunshine',
    canonicalTitle: '미스터 션샤인',
    englishTitle: 'Mr. Sunshine',
    type: 'DRAMA',
    releaseYear: 2018,
    artists: [],
    workArtwork: null,
    publicPlaceCount: 8,
    workTags: ['구한말', '사극', '로맨스'],
    summaryPoints: [
      '구한말 격변기를 배경으로 한 대하 로맨스 사극 드라마입니다.',
      '미국 군인이 된 조선인 유진 초이가 의병 활동을 하는 고애신을 만나는 이야기입니다.',
      '안동 만휴정, 하회마을 등 경북 전통 한옥 명소들이 촬영지로 등장합니다.',
    ],
    officialPageUrl: null,
    metadataSources: [],
    placesHref: '/api/v1/discovery/places?workId=w-mr-sunshine',
  },
};

const FIXTURE_K_CONTENTS: Record<string, KContentRelation[]> = {
  'p-gyeongbok': [
    {
      relationId: 'r-gyeongbok-kingdom',
      relationType: 'FILMING_LOCATION',
      work: { workId: 'w-kingdom', canonicalTitle: '킹덤', type: 'DRAMA', releaseYear: 2019 },
      contextSummary: '경복궁 근정전이 세자 이창의 즉위식 장면 등 주요 왕실 의례 씬에 활용됐습니다.',
      relationTags: ['왕실', '조선', '사극'],
      evidence: [
        {
          sourceTitle: '넷플릭스 킹덤 공식 촬영지 안내',
          sourceUrl: 'https://example.org/kingdom-locations',
          sourceType: 'OFFICIAL_TOURISM',
          publisherName: '한국관광공사',
          checkedAt: '2026-10-08T09:00:00Z',
        },
      ],
      evidenceCount: 1,
      verifiedAt: '2026-10-08T09:00:00Z',
    },
    {
      relationId: 'r-gyeongbok-seonjwa',
      relationType: 'FILMING_LOCATION',
      work: { workId: 'w-seonjwa', canonicalTitle: '슈룹', type: 'DRAMA', releaseYear: 2022 },
      contextSummary: '경복궁 경회루와 향원정이 왕실 연회 및 왕비의 산책 장면에 등장합니다.',
      relationTags: ['왕실', '조선', '사극'],
      evidence: [
        {
          sourceTitle: '슈룹 공식 촬영지 발표',
          sourceUrl: 'https://example.org/seonjwa-locations',
          sourceType: 'OFFICIAL_PRESS',
          publisherName: 'tvN 공식 보도',
          checkedAt: '2026-10-08T09:00:00Z',
        },
      ],
      evidenceCount: 1,
      verifiedAt: '2026-10-08T09:00:00Z',
    },
  ],
  'p-andong-hahoe': [
    {
      relationId: 'r-hahoe-mr-sunshine',
      relationType: 'FILMING_LOCATION',
      work: { workId: 'w-mr-sunshine', canonicalTitle: '미스터 션샤인', type: 'DRAMA', releaseYear: 2018 },
      contextSummary: '고애신의 고택으로 등장하는 안동 하회마을 양진당이 주요 배경으로 활용됐습니다.',
      relationTags: ['구한말', '한옥', '사극'],
      evidence: [
        {
          sourceTitle: '미스터 션샤인 제작 발표 촬영지 공개',
          sourceUrl: 'https://example.org/mr-sunshine-locations',
          sourceType: 'OFFICIAL_PRESS',
          publisherName: 'tvN 보도자료',
          checkedAt: '2026-10-08T09:00:00Z',
        },
        {
          sourceTitle: '안동시 문화유산 드라마 촬영지 안내',
          sourceUrl: 'https://example.org/andong-drama',
          sourceType: 'OFFICIAL_TOURISM',
          publisherName: '안동시 관광',
          checkedAt: '2026-10-08T09:00:00Z',
        },
      ],
      evidenceCount: 2,
      verifiedAt: '2026-10-08T09:00:00Z',
    },
  ],
};

export function getFixtureTopics(): DiscoveryTopic[] {
  return FIXTURE_TOPICS;
}

export function getFixturePlacesPage(params?: DiscoveryPlacesParams): DiscoveryPlacesPage {
  let items = [...FIXTURE_PLACES];

  if (params?.topic) {
    items = items.filter((p) => p.topics.includes(params.topic!));
  }
  if (params?.regionCode) {
    items = items.filter((p) => p.region.code === params.regionCode);
  }

  const limit = params?.limit ?? 20;
  const sliced = items.slice(0, limit);

  return {
    catalogRevision: 'fixture-2026-10-11',
    countsAsOf: '2026-10-11T09:00:00Z',
    matchingPlaceCount: items.length,
    facets: {
      topic: FIXTURE_TOPICS.map((t) => ({ code: t.code, labelKo: t.labelKo, count: t.placeCount })),
      regionCode: [
        { code: '11', labelKo: '서울', count: 2 },
        { code: '45', labelKo: '전북', count: 3 },
        { code: '47', labelKo: '경북', count: 2 },
        { code: '41', labelKo: '경기', count: 1 },
      ],
      placeRole: [
        { code: 'PALACE', labelKo: '궁궐', count: 2 },
        { code: 'FOLK_VILLAGE', labelKo: '민속마을', count: 1 },
        { code: 'HANOK_VILLAGE', labelKo: '한옥마을', count: 1 },
        { code: 'FORTRESS', labelKo: '산성·요새', count: 1 },
        { code: 'GARDEN', labelKo: '정원·누각', count: 1 },
        { code: 'PAVILION', labelKo: '정자', count: 1 },
        { code: 'HISTORIC_HOUSE', labelKo: '고택', count: 1 },
      ],
      type: [
        { code: 'DRAMA', count: 6 },
        { code: 'MOVIE', count: 2 },
        { code: 'MUSIC_VIDEO', count: 1 },
      ],
      workTagCode: [],
      relationTagCode: [],
    },
    items: sliced,
    hasMore: items.length > limit,
    nextCursor: items.length > limit ? 'fixture-cursor-1' : null,
  };
}

export function getFixturePlaceDetail(placeId: string): DiscoveryPlaceDetail | null {
  if (FIXTURE_PLACE_DETAILS[placeId]) return FIXTURE_PLACE_DETAILS[placeId];
  const summary = FIXTURE_PLACES.find((p) => p.placeId === placeId);
  if (!summary) return null;
  return {
    placeId: summary.placeId,
    name: summary.name,
    region: summary.region,
    address: `${summary.region.nameKo} 주소 정보 준비 중`,
    coordinates: { latitude: 36.5, longitude: 127.5 },
    description: '상세 설명 준비 중입니다.',
    sourceTaxonomy: { provider: 'TOUR_API', lclsSystm2: null, lclsSystm3: null, labelKo: '기타' },
    placeRoles: summary.placeRoles,
    topics: summary.topics,
    images: summary.placeImage ? [summary.placeImage] : [],
    odii: { linked: summary.odiiLinked, storyCount: 0 },
    kContents: {
      relationCount: summary.matchingWorkCount,
      href: `/api/v1/places/${placeId}/k-contents`,
    },
    saveAvailable: summary.saveAvailable,
    savedByMe: summary.savedByMe,
  };
}

export function getFixtureWorksPage(params?: DiscoveryWorksParams): DiscoveryWorksPage {
  let items = [...FIXTURE_WORKS];
  if (params?.type) items = items.filter((w) => w.type === params.type);
  if (params?.q) {
    const q = params.q.toLowerCase();
    items = items.filter((w) => w.canonicalTitle.toLowerCase().includes(q));
  }
  const limit = params?.limit ?? 20;
  const sliced = items.slice(0, limit);
  return {
    catalogRevision: 'fixture-2026-10-11',
    countsAsOf: '2026-10-11T09:00:00Z',
    matchingWorkCount: items.length,
    items: sliced,
    hasMore: items.length > limit,
    nextCursor: items.length > limit ? 'fixture-cursor-1' : null,
  };
}

export function getFixtureWorkDetail(workId: string): WorkDetail | null {
  if (FIXTURE_WORK_DETAILS[workId]) return FIXTURE_WORK_DETAILS[workId];
  const summary = FIXTURE_WORKS.find((w) => w.workId === workId);
  if (!summary) return null;
  return {
    ...summary,
    summaryPoints: [],
    officialPageUrl: null,
    metadataSources: [],
    placesHref: `/api/v1/discovery/places?workId=${workId}`,
  };
}

export function getFixtureKContentsPage(placeId: string): KContentsPage {
  const items = FIXTURE_K_CONTENTS[placeId] ?? [];
  return {
    catalogRevision: 'fixture-2026-10-11',
    countsAsOf: '2026-10-11T09:00:00Z',
    matchingRelationCount: items.length,
    items,
    hasMore: false,
    nextCursor: null,
  };
}

export const ALL_TOPIC_CODES: TopicCode[] = [
  'TRADITIONAL_SPACE_HERITAGE',
  'TRADITIONAL_EXPERIENCE',
  'TRADITIONAL_FOOD_TEA',
  'K_DRAMA',
  'K_MOVIE',
  'K_POP_MV',
];
