import { OdiiAtmosphere, OdiiChapterDefinition } from '@/features/odii-audio/types/odiiChapter.types';

export interface OdiiChapterExtendedDefinition extends OdiiChapterDefinition {
  heroImageUrl: string;
  mood: string;
  subTitle: string;
}

export const ARCHIVE_ATMOSPHERE: OdiiAtmosphere = {
  id: 'archive',
  backgroundColor: '#ffffff',
  radialGradient: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.9), transparent 72%)',
  texture: 'none',
  textureOpacity: 0,
  stagePattern: 'none',
  stageOpacity: 0,
};

export const ODII_CHAPTER_DEFINITIONS: OdiiChapterExtendedDefinition[] = [
  {
    id: 'hanok',
    keyword: '한옥',
    title: '한옥의 바람',
    subTitle: '처마와 마루에 머무는 느린 아침',
    narrative: '처마 끝으로 오전의 바람이 천천히 들어옵니다. 나무와 종이가 호흡하는 한옥의 조용함 속에서 오래된 시간을 느껴보세요.',
    keywords: ['한옥', '처마', '대청마루', '창호', '고택'],
    heroImageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1600&q=85',
    mood: '고즈넉함 · 여백 · 바람',
    atmosphere: {
      id: 'hanok',
      backgroundColor: '#f0f4ee',
      radialGradient: 'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.76), transparent 58%)',
      texture: 'linear-gradient(118deg, transparent 0 46%, rgba(125,155,132,0.7) 47%, transparent 48%), linear-gradient(82deg, transparent 0 72%, rgba(174,196,177,0.5) 73%, transparent 74%)',
      textureOpacity: 0.04,
      stagePattern: 'linear-gradient(90deg, transparent 0 14%, rgba(92,116,98,0.58) 14% 14.5%, transparent 14.5% 32%, rgba(92,116,98,0.42) 32% 32.5%, transparent 32.5% 56%, rgba(92,116,98,0.34) 56% 56.5%, transparent 56.5%), linear-gradient(168deg, transparent 0 68%, rgba(91,111,94,0.46) 68% 69%, transparent 69%)',
      stageOpacity: 0.028,
    },
  },
  {
    id: 'market',
    keyword: '시장',
    title: '사람의 온기, 전통시장',
    subTitle: '말 한마디와 덤 한 줌의 정',
    narrative: '한 끼의 인사와 덤 한 줌에 정이 머뭅니다. 정겨운 흥정이 오가는 장터 길목마다 사람 냄새 가득한 이야기가 피어납니다.',
    keywords: ['전통시장', '장터', '흥정', '정', '온기'],
    heroImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85',
    mood: '활기 · 사람 냄새 · 덤과 정',
    atmosphere: {
      id: 'market',
      backgroundColor: '#fdf6eb',
      radialGradient: 'radial-gradient(circle at 76% 18%, rgba(255,239,193,0.56), transparent 54%)',
      texture: 'linear-gradient(164deg, transparent 0 38%, rgba(208,145,72,0.38) 39%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(221,165,99,0.28), transparent 24%)',
      textureOpacity: 0.045,
      stagePattern: 'repeating-linear-gradient(148deg, transparent 0 34px, rgba(196,126,55,0.25) 34px 35px, transparent 35px 68px), radial-gradient(ellipse at 72% 14%, rgba(255,214,145,0.54), transparent 30%)',
      stageOpacity: 0.03,
    },
  },
  {
    id: 'seowon',
    keyword: '서원',
    title: '선비의 묵향과 서원',
    subTitle: '종이와 먹의 향이 깃든 학문의 공간',
    narrative: '종이와 먹의 향이 고요한 서원의 시간을 엽니다. 바람 소리 따라 글 읽는 소리가 들려오던 조선 선비들의 정취를 느껴보세요.',
    keywords: ['서원', '묵향', '선비', '향교', '유교'],
    heroImageUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1600&q=85',
    mood: '정갈함 · 선비 정신 · 고요',
    atmosphere: {
      id: 'seowon',
      backgroundColor: '#fbf4e8',
      radialGradient: 'radial-gradient(circle at 82% 22%, rgba(255,255,255,0.72), transparent 60%)',
      texture: 'radial-gradient(ellipse at 24% 35%, rgba(167,135,97,0.34), transparent 19%), radial-gradient(ellipse at 72% 74%, rgba(193,159,115,0.2), transparent 22%)',
      textureOpacity: 0.04,
      stagePattern: 'radial-gradient(ellipse at 18% 68%, rgba(146,111,76,0.42), transparent 23%), linear-gradient(6deg, transparent 0 72%, rgba(164,129,88,0.28) 72% 73%, transparent 73%)',
      stageOpacity: 0.026,
    },
  },
  {
    id: 'temple',
    keyword: '사찰',
    title: '산사의 종소리와 길',
    subTitle: '마음을 비우는 맑은 소리의 여운',
    narrative: '산안개 사이, 저녁 종소리가 오래된 길을 비춥니다. 사찰의 은은한 범종 소리와 함께 번뇌를 잊고 마음의 평온을 찾으세요.',
    keywords: ['사찰', '산사', '종소리', '산안개', '불교'],
    heroImageUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=1600&q=85',
    mood: '평온 · 범종 소리 · 산책',
    atmosphere: {
      id: 'temple',
      backgroundColor: '#f4eff8',
      radialGradient: 'radial-gradient(circle at 28% 18%, rgba(255,255,255,0.68), transparent 56%)',
      texture: 'linear-gradient(146deg, transparent 0 54%, rgba(111,94,132,0.34) 55%, transparent 56%), radial-gradient(ellipse at 72% 58%, rgba(158,143,177,0.26), transparent 26%)',
      textureOpacity: 0.04,
      stagePattern: 'radial-gradient(ellipse at 50% 74%, transparent 0 32%, rgba(113,95,133,0.3) 33% 33.5%, transparent 34% 47%, rgba(113,95,133,0.2) 48% 48.5%, transparent 49%), linear-gradient(180deg, rgba(255,255,255,0.3), transparent 42%)',
      stageOpacity: 0.028,
    },
  },
];

