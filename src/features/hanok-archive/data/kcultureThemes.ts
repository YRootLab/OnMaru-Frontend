/**
 * K-컬처 3대 핵심 테마 큐레이션 데이터
 *
 * 1. 🎬 K-드라마 명장면 (contentTypeId: 12 - 문화유산/관광지 로케이션)
 * 2. 🌙 달빛 야간기행 (contentTypeId: 15 - 야행/달빛기행/야간축제)
 * 3. 🍵 종가 다도 & 미식 (contentTypeId: 12/39 - 전통체험 A02020500 + 한식/반가음식 A05010100)
 */

export interface KCultureThemeItem {
  id: string;
  category: 'kdrama' | 'night' | 'heritage_food';
  categoryLabel: string;
  categoryIcon: string;
  isGyeongbukSpecial?: boolean;
  title: string;
  subtitle: string;
  eyebrow: string;
  contentId: string;
  villageName: string;
  region: string;
  addr: string;
  image: string;
  quote?: string;
  soundscapeTrack?: string;
  tags: string[];
  coursePreview: {
    day1: string[];
    day2: string[];
  };
}

export const KCULTURE_CATEGORIES = [
  { key: 'all', label: '전체 테마', icon: '✨' },
  { key: 'kdrama', label: 'K-드라마 명장면', icon: '🎬' },
  { key: 'night', label: '달빛 야간기행', icon: '🌙' },
  { key: 'heritage_food', label: '종가 다도 & 미식', icon: '🍵' },
] as const;

export type KCultureCategoryKey = (typeof KCULTURE_CATEGORIES)[number]['key'];

export const KCULTURE_REGIONS = [
  { key: 'all', label: '전국 전체' },
  { key: '서울', label: '서울' },
  { key: '경기', label: '경기' },
  { key: '강원', label: '강원' },
  { key: '충남', label: '충남' },
  { key: '충북', label: '충북' },
  { key: '경북', label: '경북 (특화)' },
  { key: '경남', label: '경남' },
  { key: '전북', label: '전북' },
  { key: '전남', label: '전남' },
  { key: '제주', label: '제주' },
] as const;

export type KCultureRegionKey = (typeof KCULTURE_REGIONS)[number]['key'];

export const KCULTURE_THEME_ITEMS: KCultureThemeItem[] = [
  {
    id: 'kculture-1',
    category: 'kdrama',
    categoryLabel: 'K-드라마 명장면',
    categoryIcon: '🎬',
    isGyeongbukSpecial: true,
    eyebrow: '드라마 <미스터 션샤인> 명대사의 무대 (TourAPI: 12)',
    title: '합시다, 러브. 만휴정의 외나무다리',
    subtitle: '조선 전기 누각과 폭포 계곡, 외나무다리 위에서 유진 초이와 고애신의 시선이 닿던 곳.',
    quote: '“러브가 무엇이오? 총 쏘는 것보다 더 어렵고, 위험하고, 뜨거운 거요.”',
    contentId: '126998',
    villageName: '안동 만휴정',
    region: '경북',
    addr: '경상북도 안동시 길안면 묵계하리길 42',
    image: 'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg',
    soundscapeTrack: '소리마루 묵계서원 시냇물 & 솔바람 소리',
    tags: ['#경북특화', '#미스터션샤인', '#외나무다리', '#Odii오디오가이드'],
    coursePreview: {
      day1: ['14:00 만휴정 외나무다리 인생샷 & 묵계서원 툇마루', '16:30 안동 고택스테이 체크인', '19:00 안동 찜닭 & 안동소주', '20:30 월영교 야경 산책'],
      day2: ['08:30 부용대에서 굽어보는 하회마을 안개', '10:30 병산서원 만대루 쉼 & 병산서원 오디오 가이드'],
    },
  },
  {
    id: 'kculture-2',
    category: 'night',
    categoryLabel: '달빛 야간기행',
    categoryIcon: '🌙',
    isGyeongbukSpecial: false,
    eyebrow: '한국관광공사 국가유산 야간 축제 (TourAPI: 15)',
    title: '창덕궁 달빛기행과 후원 비원 숲길',
    subtitle: '은은한 청사초롱 불빛을 밝히며 왕실의 후원을 거니는 궁궐 야간 탐방.',
    quote: '어둠이 내린 부용지 연못에 비치는 달빛과 규장각의 야경.',
    contentId: '126508',
    villageName: '창덕궁 달빛기행',
    region: '서울',
    addr: '서울특별시 종로구 율곡로 99 (와룡동)',
    image: 'https://tong.visitkorea.or.kr/cms/resource/98/3487598_image2_1.jpg',
    soundscapeTrack: '창덕궁 후원 밤바람 & 궁중 아악 소리',
    tags: ['#서울', '#창덕궁', '#달빛기행', '#청사초롱', '#야간개장'],
    coursePreview: {
      day1: ['15:00 북촌 한옥스테이 체크인', '17:30 삼청동 한정식 미식', '19:30 창덕궁 달빛기행 후원 산책', '21:30 연경당 전통 국악 공연'],
      day2: ['09:00 창경궁 숲길 아침 산책', '11:00 익선동 한옥 디저트 쉼'],
    },
  },
  {
    id: 'kculture-3',
    category: 'night',
    categoryLabel: '달빛 야간기행',
    categoryIcon: '🌙',
    isGyeongbukSpecial: true,
    eyebrow: '신라 천년의 달빛, 교촌한옥마을 (TourAPI: 15)',
    title: '경주 국가유산야행과 월정교 물빛',
    subtitle: '신라 왕궁 월성과 월정교가 달빛 아래 황금빛으로 물드는 야간 문화유산 축제.',
    quote: '남천 물길 위에 그림처럼 떠 있는 월정교의 웅장한 야경.',
    contentId: '2614760',
    villageName: '경주 국가유산야행',
    region: '경북',
    addr: '경상북도 경주시 인왕동 839-1',
    image: 'https://tong.visitkorea.or.kr/cms/resource/67/4103867_image2_1.JPG',
    soundscapeTrack: '월정교 물소리와 첨성대 밤바람',
    tags: ['#경북특화', '#경주야행', '#월정교야경', '#청사초롱'],
    coursePreview: {
      day1: ['15:30 교촌한옥마을 최씨고택 산책', '17:30 황리단길 한옥스테이 체크인', '19:30 월정교·첨성대 달빛 야간 투어', '21:00 동궁과 월지 야경'],
      day2: ['09:00 대릉원 아침 솔숲 걷기', '11:30 교동 쌈밥 & 경주 교동법주 시음'],
    },
  },
  {
    id: 'kculture-4',
    category: 'heritage_food',
    categoryLabel: '종가 다도 & 미식',
    categoryIcon: '🍵',
    isGyeongbukSpecial: true,
    eyebrow: '500년 내림 발효 손맛과 반가 미식 (TourAPI: 12/39)',
    title: '서애 류성룡 종가 밥상과 헛제사밥',
    subtitle: '수백 년 종택 장독대에서 익은 발효 내림음식과 유생들의 밤참에서 유래한 안동 헛제사밥.',
    quote: '한옥의 깊은 맛은 시간과 정성에서 나옵니다. 흙과 나무, 장독대가 빚어낸 한 끼.',
    contentId: '894027',
    villageName: '안동 하회마을 & 헛제사밥',
    region: '경북',
    addr: '경상북도 안동시 풍천면 전서로 186-8',
    image: 'https://tong.visitkorea.or.kr/cms/resource/62/4059762_image2_1.jpg',
    soundscapeTrack: '다도 찻물 따르는 소리 & 처마 빗소리',
    tags: ['#경북특화', '#종가밥상', '#안동헛제사밥', '#내림발효', '#종가다도'],
    coursePreview: {
      day1: ['14:30 양진당·충효당 종택 둘러보기', '16:00 대청마루 종가 다도 체험', '18:30 50년 전통 안동 헛제사밥 정식', '20:30 월영교 물빛 야경 산책'],
      day2: ['08:30 따뜻한 장국 조식', '10:30 병산서원 배롱나무길 사색'],
    },
  },
];
