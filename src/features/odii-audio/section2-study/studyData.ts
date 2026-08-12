export interface Section2StudyStory {
  id: string;
  title: string;
  audioTitle: string;
  category: string;
  location: string;
  duration: string;
  imageSrc: string;
}

export const SECTION2_STUDY_STORIES: Section2StudyStory[] = [
  {
    id: 'story-1',
    title: '병산서원, 바람이 머무는 만대루',
    audioTitle: '낙동강을 바라보는 유생들의 오후',
    category: '서원/향교',
    location: '경북 안동 · 병산서원',
    duration: '08:24',
    imageSrc: '/images/hanok/hanok-main.png',
  },
  {
    id: 'story-2',
    title: '창덕궁 후원에 내리는 여름비',
    audioTitle: '부용지 곁에서 듣는 빗소리',
    category: '궁궐/역사',
    location: '서울 종로 · 창덕궁',
    duration: '06:10',
    imageSrc: '/images/hanok/hanok-exterior.png',
  },
  {
    id: 'story-3',
    title: '전주 골목을 깨우는 첫 가마솥',
    audioTitle: '한옥마을의 이른 아침 풍경',
    category: '마을/골목길',
    location: '전북 전주 · 한옥마을',
    duration: '11:02',
    imageSrc: '/images/hanok/hanok-interior.png',
  },
  {
    id: 'story-4',
    title: '소쇄원 담장 너머 흐르는 물길',
    audioTitle: '광풍각 대청에 앉아 듣는 정원',
    category: '자연/둘레길',
    location: '전남 담양 · 소쇄원',
    duration: '09:18',
    imageSrc: '/images/hanok/hanok-porch.png',
  },
  {
    id: 'story-5',
    title: '북촌 처마 끝에 걸린 저녁빛',
    audioTitle: '백 년 고택의 하루가 닫히는 시간',
    category: '한옥/고택',
    location: '서울 종로 · 북촌',
    duration: '07:36',
    imageSrc: '/images/hanok/giwa-detail.png',
  },
];

export const SECTION2_STUDY_VARIANTS = [
  {
    id: 'compact-poster',
    number: '01',
    title: '낮은 포스터',
    description: '높이와 내부 간격을 줄인 기본 개선안',
  },
  {
    id: 'overlay-info',
    number: '02',
    title: '정보 오버레이',
    description: '정보 패널을 썸네일 안으로 올린 구성',
  },
  {
    id: 'editorial-caption',
    number: '03',
    title: '분리형 캡션',
    description: '이미지와 캡션의 프레임을 분리한 구성',
  },
  {
    id: 'landscape-card',
    number: '04',
    title: '가로형 카드',
    description: '이미지와 정보를 좌우로 배치한 구성',
  },
] as const;

export function getStudyPlaybackLabel(selectedStoryId: string | null, storyId: string) {
  return selectedStoryId === storyId ? '재생 중' : '재생';
}
