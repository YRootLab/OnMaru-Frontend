import { OdiiAtmosphere, OdiiChapterDefinition } from '../types/odiiChapter.types';

export const ARCHIVE_ATMOSPHERE: OdiiAtmosphere = {
  id: 'archive',
  backgroundColor: '#ffffff',
  radialGradient: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.9), transparent 72%)',
  texture: 'none',
  textureOpacity: 0,
  stagePattern: 'none',
  stageOpacity: 0,
};

export const ODII_CHAPTER_DEFINITIONS: OdiiChapterDefinition[] = [
  {
    id: 'hanok',
    keyword: '한옥',
    title: '한옥의 바람',
    narrative: '처마 끝으로 오전의 바람이 천천히 들어옵니다.',
    keywords: ['한옥', '처마', '대청마루', '창호'],
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
    id: 'seowon',
    keyword: '서원',
    title: '선비의 묵향과 서원',
    narrative: '종이와 먹의 향이 고요한 서원의 시간을 엽니다.',
    keywords: ['서원', '묵향', '선비', '유교'],
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
    id: 'market',
    keyword: '시장',
    title: '사람의 온기, 전통시장',
    narrative: '한 끼의 인사와 덤 한 줌에 사람의 정이 머뭅니다.',
    keywords: ['전통시장', '장터', '흥정', '정'],
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
    id: 'temple',
    keyword: '사찰',
    title: '산사의 종소리와 길',
    narrative: '산안개 사이, 저녁 종소리가 오래된 길을 비춥니다.',
    keywords: ['사찰', '산사', '종소리', '산안개'],
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
