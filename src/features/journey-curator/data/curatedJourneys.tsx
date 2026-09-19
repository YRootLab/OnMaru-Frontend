import React from 'react';
import { Cloud, ShoppingBag, Headphones, CloudRain, Leaf } from 'lucide-react';
import type { BentoJourneyPlan, MoodOption } from '../types/journey.types';

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'quiet',
    label: '조용한 산책',
    icon: <Cloud size={16} strokeWidth={2} />,
    query: '사람이 붐비지 않고 고즈넉하게 한옥 골목을 산책할 수 있는 곳',
  },
  {
    id: 'market',
    label: '정겨운 시장',
    icon: <ShoppingBag size={16} strokeWidth={2} />,
    query: '한옥의 정취와 활기찬 전통시장 먹거리를 함께 즐길 수 있는 여정',
  },
  {
    id: 'story',
    label: '이야기와 해설',
    icon: <Headphones size={16} strokeWidth={2} />,
    query: '문화재 해설과 역사적 숨은 이야기가 얽혀있는 유서 깊은 장소',
  },
  {
    id: 'rainy',
    label: '비 오는 날 운치',
    icon: <CloudRain size={16} strokeWidth={2} />,
    query: '빗소리와 기와 처마의 낙숫물이 아름다운 전통 한옥 정원',
  },
  {
    id: 'rest',
    label: '편안한 쉼',
    icon: <Leaf size={16} strokeWidth={2} />,
    query: '걸음 수를 줄이고 툇마루에서 여유롭게 쉴 수 있는 힐링 한옥',
  },
];

export const JOURNEY_PLANS: Record<string, BentoJourneyPlan> = {
  quiet: {
    id: 'quiet',
    querySummary: '서울 서촌 · 고즈넉한 한옥과 한적한 골목 산책',
    title: '느린 걸음으로 만나는 서울의 옛 숨결',
    tagline: '인파가 닿지 않는 서촌의 뒷골목에서 처마 끝 하늘을 바라봅니다.',
    region: '서울 종로구 서촌 일대',
    moodKeywords: ['고요한 아침', '골목 산책', '툇마루 쉼', '낮은 혼잡도'],
    nodes: [
      { id: 'n-reg', label: '서울 종로', category: 'region', x: 18, y: 35, badge: '수도권' },
      { id: 'n-hanok', label: '서촌 한옥골목', category: 'hanok', x: 42, y: 20, badge: '문화유산' },
      { id: 'n-market', label: '통인시장', category: 'market', x: 44, y: 68, badge: '전통시장' },
      { id: 'n-sorimaru', label: '백인제가옥 해설', category: 'sorimaru', x: 74, y: 22, badge: '소리마루' },
      { id: 'n-warmth', label: '서촌 온기: 한적함', category: 'warmth', x: 75, y: 70, badge: '실시간 온기' },
    ],
    edges: [
      { id: 'e1', source: 'n-reg', target: 'n-hanok', label: '돌담길 연결' },
      { id: 'e2', source: 'n-reg', target: 'n-market', label: '도보 12분' },
      { id: 'e3', source: 'n-hanok', target: 'n-sorimaru', label: '공간 오디오 스토리' },
      { id: 'e4', source: 'n-market', target: 'n-warmth', label: '혼잡도 24% (한적)' },
      { id: 'e5', source: 'n-hanok', target: 'n-warmth', dashed: true, label: '여행자 발자취' },
    ],
    routeCard: {
      title: '서촌 골목길 슬로우 트레킹 (약 2.4km)',
      duration: '약 2시간 30분',
      walkingTime: '도보 40분',
      stops: [
        { time: '14:00', name: '경복궁역 2번 출구', category: '출발', description: '골목 산책 시작' },
        { time: '14:30', name: '서촌 누하동 한옥길', category: '한옥', description: '골목 처마길 조용한 사색' },
        { time: '15:20', name: '통인시장 누각길', category: '시장', description: '기름떡볶이와 정겨운 정취' },
        { time: '16:10', name: '수성동 계곡 쉼터', category: '자연', description: '인왕산 자락 소리 감상' },
      ],
      mapLink: '/map?lat=37.5802&lng=126.9698&level=5',
    },
    hanokCard: {
      title: '서촌 상촌재 (전통 한옥)',
      location: '서울 종로구 옥인길 19',
      imageUrl: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
      architecturalPoint: '조선 말기 도시형 한옥의 온돌과 마루 구조를 원형 그대로 복원',
      era: '조선 후기 도시형 한옥',
      hanokLink: '/hanok',
    },
    sorimaruCard: {
      title: '서촌, 예술가들이 거닐던 골목 이야기',
      subtitle: '이상과 윤동주의 시선이 머문 한옥 골목길',
      duration: '4분 12초',
      narrator: '한국관광공사 문화관광해설사',
      excerpt: '인왕산 아래 자리잡은 서촌은 겸재 정선부터 시인 윤동주까지 한국의 예술혼이 머물렀던 터전입니다...',
      sorimaruLink: '/sorimaru',
    },
    warmthCard: {
      status: '한적함',
      percentage: 24,
      bestTime: '오후 14:00 ~ 16:30',
      vibeComment: '현재 방문객이 적어 고즈넉하게 산책하기 매우 좋은 시간대입니다.',
      recentCount: 18,
    },
  },

  market: {
    id: 'market',
    querySummary: '전주 · 한옥마을의 정취와 남부 야시장 먹거리',
    title: '맛과 멋이 흐르는 전주 옛 정취 탐방',
    tagline: '경기전의 고즈넉한 대나무 숲을 지나 남부시장의 온기 가득한 골목으로 이어집니다.',
    region: '전북 전주시 완산구 풍남문 일대',
    moodKeywords: ['풍성한 정', '전통 야시장', '경기전 대숲', '따뜻한 온기'],
    nodes: [
      { id: 'n-reg', label: '전북 전주', category: 'region', x: 18, y: 35, badge: '호남권' },
      { id: 'n-hanok', label: '전주 경기전', category: 'hanok', x: 42, y: 20, badge: '태조어진 봉안' },
      { id: 'n-market', label: '전주 남부시장', category: 'market', x: 44, y: 68, badge: '청년몰·피순대' },
      { id: 'n-sorimaru', label: '경기전 어진 이야기', category: 'sorimaru', x: 74, y: 22, badge: '소리마루' },
      { id: 'n-warmth', label: '남부시장 온기: 북적임', category: 'warmth', x: 75, y: 70, badge: '실시간 온기' },
    ],
    edges: [
      { id: 'e1', source: 'n-reg', target: 'n-hanok', label: '한옥마을 중심' },
      { id: 'e2', source: 'n-reg', target: 'n-market', label: '풍남문 건너편' },
      { id: 'e3', source: 'n-hanok', target: 'n-sorimaru', label: '문화재 오디오 도슨트' },
      { id: 'e4', source: 'n-market', target: 'n-warmth', label: '인기 집중 구역' },
      { id: 'e5', source: 'n-hanok', target: 'n-market', dashed: true, label: '도보 8분 거리' },
    ],
    routeCard: {
      title: '전주 한옥 & 정겨운 시장 투어 (약 1.8km)',
      duration: '약 3시간',
      walkingTime: '도보 25분',
      stops: [
        { time: '15:30', name: '전주 경기전', category: '한옥', description: '태조 이성계 어진과 울창한 대숲' },
        { time: '16:40', name: '전동성당 골목', category: '명소', description: '서양식 붉은 벽돌과 한옥의 대비' },
        { time: '17:30', name: '전주 남부시장 2층 청년몰', category: '시장', description: '청년 작가 공방과 쉼터' },
        { time: '18:30', name: '남부 야시장 먹거리', category: '음식', description: '풍성한 온기가 느껴지는 정통 야시장' },
      ],
      mapLink: '/map?lat=35.8156&lng=127.1500&level=6',
    },
    hanokCard: {
      title: '전주 학인당 (백년 전통한옥)',
      location: '전북 전주시 완산구 향교길 45',
      imageUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80',
      architecturalPoint: '높은 천장과 웅장한 대청마루, 조선 궁중 양식을 도입한 전북 민가 건축',
      era: '1908년 대한제국 고종 시대',
      hanokLink: '/hanok',
    },
    sorimaruCard: {
      title: '조선 왕조의 본향, 전주 경기전의 비밀',
      subtitle: '태조 이성계 어진을 지켜낸 사람들의 숨은 기록',
      duration: '5분 48초',
      narrator: 'SORIMARU 공간 역사 해설',
      excerpt: '임진왜란의 전화 속에서도 실록과 어진을 묘향산으로 옮겨 지켜낸 전주 사람들의 지혜와 충정...',
      sorimaruLink: '/sorimaru',
    },
    warmthCard: {
      status: '북적임',
      percentage: 78,
      bestTime: '오후 15:00 ~ 17:00 (한옥) / 18:30 이후 (시장)',
      vibeComment: '저녁 시간이 가까워질수록 남부시장의 온기가 따스하게 피어오릅니다.',
      recentCount: 64,
    },
  },

  story: {
    id: 'story',
    querySummary: '안동 · 유교 문화와 낙동강 병산서원의 역사 이야기',
    title: '선비의 지혜를 듣는 안동 역사 로드',
    tagline: '낙동강 물줄기를 따라 하회마을 부용대와 병산서원의 만대루에 얽힌 일화를 만납니다.',
    region: '경북 안동시 풍천면 일대',
    moodKeywords: ['선비 문화', '역사 고증', 'SORIMARU 해설', '만대루 절경'],
    nodes: [
      { id: 'n-reg', label: '경북 안동', category: 'region', x: 18, y: 35, badge: '영남 유교권' },
      { id: 'n-hanok', label: '안동 하회마을', category: 'hanok', x: 42, y: 20, badge: '유네스코 유산' },
      { id: 'n-market', label: '구시장 찜닭골목', category: 'market', x: 44, y: 68, badge: '원조 전통시장' },
      { id: 'n-sorimaru', label: '병산서원 만대루', category: 'sorimaru', x: 74, y: 22, badge: '소리마루' },
      { id: 'n-warmth', label: '하회 온기: 보통', category: 'warmth', x: 75, y: 70, badge: '실시간 온기' },
    ],
    edges: [
      { id: 'e1', source: 'n-reg', target: 'n-hanok', label: '낙동강 S자 수계' },
      { id: 'e2', source: 'n-reg', target: 'n-market', label: '안동 원도심' },
      { id: 'e3', source: 'n-hanok', target: 'n-sorimaru', label: '서애 류성룡 스토리' },
      { id: 'e4', source: 'n-market', target: 'n-warmth', label: '여행자 추천 1위' },
      { id: 'e5', source: 'n-hanok', target: 'n-warmth', dashed: true, label: '문화재 보호' },
    ],
    routeCard: {
      title: '안동 시간여행 역사 투어 (차량 이동 병행)',
      duration: '약 4시간',
      walkingTime: '도보 50분',
      stops: [
        { time: '10:30', name: '안동 하회마을 양진당', category: '한옥', description: '풍산 류씨 대종택의 웅장한 가옥' },
        { time: '12:00', name: '부용대 나룻배', category: '명소', description: '강 건너 절벽에서 내려다보는 마을 전경' },
        { time: '13:30', name: '병산서원 만대루', category: '문화', description: '기둥 사이로 흐르는 낙동강 풍경' },
        { time: '15:00', name: '안동 구시장', category: '시장', description: '정통 안동찜닭과 간고등어 정취' },
      ],
      mapLink: '/map?lat=36.5393&lng=128.5181&level=7',
    },
    hanokCard: {
      title: '안동 충효당 (보물 제414호)',
      location: '경북 안동시 풍천면 하회종가길 69',
      imageUrl: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
      architecturalPoint: '서애 류성룡 선생의 종택으로, 12칸 행랑채와 소박하면서도 기품 있는 조선 사대부 가옥',
      era: '조선 중기 (17세기)',
      hanokLink: '/hanok',
    },
    sorimaruCard: {
      title: '병산서원 만대루의 7개 기둥이 담은 산수화',
      subtitle: '자연을 건축의 창으로 빌려온 차경(借景)의 미학',
      duration: '6분 15초',
      narrator: '국립안동대학교 한국문화연구소',
      excerpt: '만대루에 올라서면 인공적인 담장 대신 일곱 개의 기둥 사이로 낙동강과 백사장이 병풍처럼 펼쳐집니다...',
      sorimaruLink: '/sorimaru',
    },
    warmthCard: {
      status: '보통',
      percentage: 45,
      bestTime: '오전 10:00 ~ 13:00',
      vibeComment: '오전 시간대에 방문하시면 바람 소리와 낙동강 물소리를 가장 맑게 들으실 수 있습니다.',
      recentCount: 32,
    },
  },

  rainy: {
    id: 'rainy',
    querySummary: '담양 · 빗소리가 아름다운 소쇄원과 푸른 대숲 정원',
    title: '낙숫물 소리에 귀 기울이는 담양 원림 기행',
    tagline: '자연 계곡을 그대로 품은 소쇄원의 광풍각 툇마루에서 빗소리를 감상합니다.',
    region: '전남 담양군 가사문학면 일대',
    moodKeywords: ['처마 낙숫물', '자연 원림', '대숲 바람소리', '차 한 잔의 쉼'],
    nodes: [
      { id: 'n-reg', label: '전남 담양', category: 'region', x: 18, y: 35, badge: '대숲의 고장' },
      { id: 'n-hanok', label: '소쇄원 광풍각', category: 'hanok', x: 42, y: 20, badge: '조선 최고 원림' },
      { id: 'n-market', label: '담양 국수거리', category: 'market', x: 44, y: 68, badge: '관방제림 길' },
      { id: 'n-sorimaru', label: '소쇄처사 양산보 이야기', category: 'sorimaru', x: 74, y: 22, badge: '소리마루' },
      { id: 'n-warmth', label: '담양 온기: 한적함', category: 'warmth', x: 75, y: 70, badge: '실시간 온기' },
    ],
    edges: [
      { id: 'e1', source: 'n-reg', target: 'n-hanok', label: '자연 계곡 축조' },
      { id: 'e2', source: 'n-reg', target: 'n-market', label: '영산강 자락' },
      { id: 'e3', source: 'n-hanok', target: 'n-sorimaru', label: '가사문학 오디오' },
      { id: 'e4', source: 'n-market', target: 'n-warmth', label: '비 오는 날 정취' },
      { id: 'e5', source: 'n-hanok', target: 'n-warmth', dashed: true, label: '한적한 빗소리' },
    ],
    routeCard: {
      title: '비 오는 날의 담양 서정 로드 (약 1.5km)',
      duration: '약 2시간',
      walkingTime: '도보 30분',
      stops: [
        { time: '13:00', name: '담양 소쇄원 입구', category: '출발', description: '대나무 숲길 빗소리 감상' },
        { time: '13:30', name: '광풍각(光風閣)', category: '한옥', description: '계곡 바위 위 정자 툇마루 쉼' },
        { time: '14:30', name: '제월당(霽月堂)', category: '문화', description: '비 갠 뒤의 달을 기다리던 사랑방' },
        { time: '15:10', name: '담양 국수거리 전통찻집', category: '음식', description: '따뜻한 죽로차 한 잔' },
      ],
      mapLink: '/map?lat=35.2340&lng=127.0060&level=6',
    },
    hanokCard: {
      title: '담양 소쇄원 제월당 & 광풍각',
      location: '전남 담양군 가사문학면 소쇄원길 17',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      architecturalPoint: '인공적인 석축을 최소화하고 흙담에 구멍을 내어 계곡물을 그대로 통과시킨 친환경 누정 건축',
      era: '조선 중종 25년 (1530년경)',
      hanokLink: '/hanok',
    },
    sorimaruCard: {
      title: '소쇄원 계곡에 흐르는 양산보의 철학',
      subtitle: '스승 조광조를 기리며 자연으로 귀의한 선비의 정원',
      duration: '5분 02초',
      narrator: '가사문학관 학예연구사',
      excerpt: '비가 내리면 광풍각 기와지붕에서 떨어지는 낙숫물이 댓잎에 부딪쳐 천상의 화음을 만들어냅니다...',
      sorimaruLink: '/sorimaru',
    },
    warmthCard: {
      status: '한적함',
      percentage: 18,
      bestTime: '비 내리는 오후 13:00 ~ 15:30',
      vibeComment: '비가 올 때 방문하시면 다른 계절에는 느낄 수 없는 깊은 흙냄새와 물소리를 만끽할 수 있습니다.',
      recentCount: 12,
    },
  },

  rest: {
    id: 'rest',
    querySummary: '경주 · 고택 툇마루에서 즐기는 따뜻한 차와 잔잔한 쉼',
    title: '천년 고도에서 찾는 온전한 휴식',
    tagline: '교촌 한옥마을의 너른 마당과 월정교의 잔잔한 물빛을 바라보며 깊은 휴식을 얻습니다.',
    region: '경북 경주시 교동 일대',
    moodKeywords: ['툇마루 휴식', '천년 고택', '월정교 야경', '마음 비우기'],
    nodes: [
      { id: 'n-reg', label: '경북 경주', category: 'region', x: 18, y: 35, badge: '신라·조선 공존' },
      { id: 'n-hanok', label: '경주 교촌 최부자댁', category: 'hanok', x: 42, y: 20, badge: '나눔의 미학' },
      { id: 'n-market', label: '경주 중앙시장 야시장', category: 'market', x: 44, y: 68, badge: '만원의 행복' },
      { id: 'n-sorimaru', label: '월정교와 원효대사 설화', category: 'sorimaru', x: 74, y: 22, badge: '소리마루' },
      { id: 'n-warmth', label: '교촌 온기: 한적함', category: 'warmth', x: 75, y: 70, badge: '실시간 온기' },
    ],
    edges: [
      { id: 'e1', source: 'n-reg', target: 'n-hanok', label: '남천 물길' },
      { id: 'e2', source: 'n-reg', target: 'n-market', label: '성동/중앙시장' },
      { id: 'e3', source: 'n-hanok', target: 'n-sorimaru', label: '월정교 설화 연결' },
      { id: 'e4', source: 'n-market', target: 'n-warmth', label: '평온한 온기' },
      { id: 'e5', source: 'n-hanok', target: 'n-warmth', dashed: true, label: '마당 산책' },
    ],
    routeCard: {
      title: '경주 교촌 힐링 슬로우 로드 (약 1.2km)',
      duration: '약 2시간 30분',
      walkingTime: '도보 20분',
      stops: [
        { time: '14:30', name: '경주 최부자댁', category: '한옥', description: '백년 가옥 안채 툇마루에서 휴식' },
        { time: '15:30', name: '교촌마을 전통 다도방', category: '체험', description: '따뜻한 국화차와 쌀강정' },
        { time: '16:40', name: '월정교 누각 산책로', category: '자연', description: '남천 위 누교를 천천히 거닐기' },
        { time: '17:30', name: '계림 숲길 벤치', category: '쉼터', description: '천년 느티나무 아래 사색' },
      ],
      mapLink: '/map?lat=35.8328&lng=129.2190&level=6',
    },
    hanokCard: {
      title: '경주 교동 최씨 고택 (국가민속문화재)',
      location: '경북 경주시 교촌안길 19-21',
      imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
      architecturalPoint: '너른 행랑채와 "ㅁ"자형 안채, 사방으로 바람이 통하는 전통 남도 양식의 목조 가옥',
      era: '조선 숙종 시대',
      hanokLink: '/hanok',
    },
    sorimaruCard: {
      title: '사방 백 리 안에 굶는 이가 없게 하라',
      subtitle: '경주 최부잣집 12대 400년 나눔과 상생의 가르침',
      duration: '4분 38초',
      narrator: '경주시 문화재과 도슨트',
      excerpt: '가훈으로 내려온 육훈(六訓)과 함께 지은 흉년의 곳간 개방... 진정한 한국의 노블레스 오블리주를 만납니다.',
      sorimaruLink: '/sorimaru',
    },
    warmthCard: {
      status: '한적함',
      percentage: 28,
      bestTime: '오후 14:00 ~ 17:00',
      vibeComment: '도심의 소음에서 벗어나 툇마루에 앉아 바람 소리를 즐기기에 완벽합니다.',
      recentCount: 22,
    },
  },
};

/** 자연어 쿼리 분석 및 가장 적합한 여정 플랜 매칭 */
export function matchJourneyPlan(query: string): BentoJourneyPlan {
  const lower = query.toLowerCase();

  if (lower.includes('시장') || lower.includes('전주') || lower.includes('먹거리') || lower.includes('야시장')) {
    return JOURNEY_PLANS.market;
  }
  if (lower.includes('역사') || lower.includes('안동') || lower.includes('선비') || lower.includes('서원') || lower.includes('이야기') || lower.includes('해설')) {
    return JOURNEY_PLANS.story;
  }
  if (lower.includes('비') || lower.includes('담양') || lower.includes('대나무') || lower.includes('정원') || lower.includes('소쇄원')) {
    return JOURNEY_PLANS.rainy;
  }
  if (lower.includes('쉼') || lower.includes('휴식') || lower.includes('지친') || lower.includes('경주') || lower.includes('피곤') || lower.includes('툇마루')) {
    return JOURNEY_PLANS.rest;
  }

  // 기본은 고즈넉하고 조용한 산책 (quiet)
  return JOURNEY_PLANS.quiet;
}
