import { darkPalette } from '@/design-system/tokens';

export interface HotspotData {
  id: string;
  number: number;
  nameKo: string;
  nameEn: string;
  x: number;
  y: number;
  labelDir: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  shortTag: string;
  desc: string;
  detail: string;
  color: string;
}

export const HOTSPOTS: HotspotData[] = [
  {
    id: 'giwa',
    number: 1,
    nameKo: '기와 · 처마',
    nameEn: 'Giwa & Cheoma',
    x: 50,
    y: 14,
    labelDir: 'top-right',
    shortTag: '기와',
    color: '#4a6fa5',
    desc: '음양 원리로 배열된 암수기와, 수학적으로 완벽한 처마 곡선.',
    detail: '28.5°의 처마 각도는 여름 직사광선을 막고 겨울 햇빛은 깊숙이 들이는 패시브 에너지 설계입니다. 암키와와 수키와가 교대로 맞물려 빗물을 완벽하게 흘려보냅니다.',
  },
  {
    id: 'daedeulbo',
    number: 2,
    nameKo: '대들보 · 서까래',
    nameEn: 'Main Beam & Rafters',
    x: 46,
    y: 36,
    labelDir: 'top-left',
    shortTag: '대들보',
    color: '#8b6f47',
    desc: '못 없이 홈으로만 결합하는 사개맞춤 목조 구조. 지진의 횡력을 탄력적으로 분산.',
    detail: '대들보는 앞기둥과 뒷기둥을 연결하며 지붕 전체 하중을 받아냅니다. 결구 방식은 지반 침하에도 건물이 유연하게 움직이며 스스로 안정을 찾도록 합니다.',
  },
  {
    id: 'changho',
    number: 3,
    nameKo: '창호',
    nameEn: 'Paper Door (Changho)',
    x: 28,
    y: 52,
    labelDir: 'bottom-left',
    shortTag: '창호',
    color: '#5a8a5a',
    desc: '한지가 빛을 산란시켜 실내에 숲속 같은 은은한 채광을 만듭니다.',
    detail: '창호지의 미세 구멍은 습기를 자연 조절하고 소리를 흡수합니다. 기하학적 살대 패턴은 단순한 장식이 아닌 구조 보강재입니다. 여름엔 통풍구, 겨울엔 단열재로 기능합니다.',
  },
  {
    id: 'ondol',
    number: 4,
    nameKo: '온돌',
    nameEn: 'Radiant Floor (Ondol)',
    x: 36,
    y: 67,
    labelDir: 'bottom-left',
    shortTag: '온돌',
    color: '#c0522a',
    desc: '아궁이 열기로 구들장을 달궈 복사열로 방 전체를 온기로 채웁니다.',
    detail: '구들장은 한 번 달궈지면 8~12시간 온기를 유지합니다. 원적외선 복사열은 현대 과학이 입증한 가장 건강한 난방 방식입니다. 연기는 굴뚝으로, 열기는 바닥으로.',
  },
  {
    id: 'maru',
    number: 5,
    nameKo: '대청마루',
    nameEn: 'Open Hall (Daecheong)',
    x: 72,
    y: 55,
    labelDir: 'bottom-right',
    shortTag: '마루',
    color: '#d4af37',
    desc: '안과 밖의 경계가 지워지는 환대의 중심 공간.',
    detail: '앞문과 뒷문을 모두 열면 통풍 통로가 열리며 여름 더위를 이깁니다. 한옥의 사회적 중심이자 자연과 사람을 잇는 인터페이스입니다. 마루에 걸터앉아 마당을 바라보는 그 시선이 온마루의 시작점입니다.',
  },
];

export interface StructureCardData {
  id: string;
  nameKo: string;
  nameEn: string;
  emoji: string;
  desc: string;
  fact: string;
  color: string;
}

export const STRUCTURE_CARDS: StructureCardData[] = [
  {
    id: 'yongmaru',
    nameKo: '용마루',
    nameEn: 'Ridge Beam (Yongmaru)',
    emoji: '⛩',
    desc: '지붕 가장 높은 곳의 수평 마루대. 암수 기와로 봉긋하게 마감.',
    fact: '용마루는 집의 액운을 막는다고 믿어 양 끝에 망새(용두) 장식을 올렸습니다.',
    color: '#D4AF37',
  },
  {
    id: 'boaji',
    nameKo: '보아지',
    nameEn: 'Bracket (Boaji)',
    emoji: '🔩',
    desc: '기둥과 보 사이에서 하중을 분산시키는 목조 브라켓 요소.',
    fact: '단 하나의 못도 사용하지 않고 맞춤(홈)으로만 결합하는 한옥 목공예의 핵심 기술입니다.',
    color: '#a8855b',
  },
  {
    id: 'gidung',
    nameKo: '기둥',
    nameEn: 'Column (Gidung)',
    emoji: '🏛',
    desc: '수직 하중을 땅까지 전달하는 골격. 원기둥과 사각기둥이 혼용.',
    fact: '최고급 한옥은 자연스럽게 휘어진 나무를 구조 계산에 맞게 굳이 휜 채로 사용합니다. 이를 "원목의 기억"이라 부릅니다.',
    color: '#8b6f47',
  },
  {
    id: 'gujang',
    nameKo: '구들장',
    nameEn: 'Floor Stone (Gudeulgang)',
    emoji: '🔥',
    desc: '온돌 바닥을 이루는 편평한 돌판. 열을 저장하고 복사하는 축열체.',
    fact: '구들장은 한 번 달궈지면 8~12시간 동안 온기를 유지합니다. 현대 바닥난방의 원형입니다.',
    color: '#c0522a',
  },
  {
    id: 'damjang',
    nameKo: '담장',
    nameEn: 'Perimeter Wall (Damjang)',
    emoji: '🧱',
    desc: '내외부 경계를 짓되 자연의 소리와 빛은 통과시키는 낮은 담.',
    fact: '한옥 담장은 높게 쌓지 않습니다. "완전히 막는 것"이 아니라 "느슨하게 구분하는 것"이 한국 공간 철학입니다.',
    color: '#7a7a6a',
  },
  {
    id: 'sotulmun',
    nameKo: '솟을대문',
    nameEn: 'Grand Gate (Sotulmun)',
    emoji: '🚪',
    desc: '신분을 드러내는 높은 대문. 행랑채 지붕보다 높이 솟아오른 위용.',
    fact: '솟을대문의 높이는 조선시대 법제로 규제되어, 신분 사회의 위계가 건축 언어로 표현되었습니다.',
    color: '#4a6fa5',
  },
  {
    id: 'cheoma',
    nameKo: '처마',
    nameEn: 'Eave (Cheoma)',
    emoji: '🌿',
    desc: '지붕이 벽면 밖으로 뻗어 나온 부분. 비와 햇빛을 조절하는 자연 차양.',
    fact: '처마 길이는 위도에 따라 최적화됩니다. 한반도 중부 기준으로 하지에는 햇빛을 완전히 차단하고, 동지에는 실내 깊숙이 햇빛이 들어옵니다.',
    color: '#5a8a5a',
  },
  {
    id: 'haengnangchae',
    nameKo: '행랑채',
    nameEn: 'Servant\'s Quarters',
    emoji: '🏠',
    desc: '대문 옆에 놓인 하인들의 공간. 집의 첫 번째 방어선이자 안전망.',
    fact: '행랑채는 오늘날의 경비 시스템 + 게스트하우스 역할을 겸했습니다. 집 규모의 사회적 지위도 행랑채 규모로 가늠했습니다.',
    color: '#6a4a6a',
  },
];

export interface HanokStageData {
  step: number;
  id: string;
  nameKo: string;
  nameEn: string;
  shortTag: string;
  color: string;
  desc: string;
  detail: string;
  meshKeywords: string[];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  mobileCameraTarget?: [number, number, number];
  fov: number;
  from: [number, number, number];
}

export const STAGES: HanokStageData[] = [
  {
    step: 1,
    id: 'stage-1',
    nameKo: '기단',
    nameEn: 'Stylobate',
    shortTag: '01. 기단',
    color: darkPalette.juhong[200],
    desc: '건물의 하중을 지반에 고르게 전달하고 빗물과 지하수로부터 건물을 보호하기 위해 터보다 한층 높게 쌓은 기초 단입니다. 삼국시대부터 한옥의 핵심 구성 요소로 쓰였으며, 흙이나 돌 등 다양한 재료를 층층이 쌓아 올려 완성합니다. 기단의 높낮이를 다르게 설정하여 건축물에 공간의 위계성과 장중한 위엄을 부여합니다.',
    detail: '',
    meshKeywords: ['Kidan'],
    cameraPos: [14, 1.2, 15],
    cameraTarget: [0, 0.8, 0],
    fov: 45,
    from: [0, -15, 0],
  },
  {
    step: 2,
    id: 'stage-2',
    nameKo: '댓돌',
    nameEn: 'Stepping Stone',
    shortTag: '02. 댓돌',
    color: darkPalette.hwanggeum[400],
    desc: '지열을 피하고 통풍을 원활하게 하기 위해 기단에서 높게 띄워진 마루와 땅바닥 사이의 단차를 극복하는 디딤돌입니다. 별도의 현관 없이 신발을 벗고 바로 마루로 올라가는 한옥의 고유한 출입 구조를 위해 고안되었습니다. 보행의 피로를 덜어주며 안과 밖을 잇는 실용적인 계단 역할을 수행합니다.',
    detail: '',
    meshKeywords: ['Step'],
    cameraPos: [5, 2.2, 5.5],
    cameraTarget: [0, 1.2, 0],
    fov: 30,
    from: [0, -10, 0],
  },
  {
    step: 3,
    id: 'stage-3',
    nameKo: '초석과 기둥',
    nameEn: 'Foundation Stone & Pillar',
    shortTag: '03. 초석과 기둥',
    color: darkPalette.juhong[400],
    desc: '초석은 기둥을 통해 내려오는 지붕의 무게를 지반에 분산시키는 돌 부재로, 남은 배열을 통해 소실된 건물의 본래 형태를 추정하는 핵심 단서가 됩니다. 기둥은 공간을 형성하는 수직 뼈대로, 원통형이나 배흘림 등 다양한 형태로 입면에 시각적 아름다움을 더합니다. 또한 귀솟음과 안쏠림 기법을 적용하여 착시를 막고 구조적 안정성을 극대화합니다.',
    detail: '',
    meshKeywords: ['Pillar'],
    cameraPos: [10, 0.8, 10],
    cameraTarget: [0, 3.2, 0],
    fov: 60,
    from: [0, -25, 0],
  },
  {
    step: 4,
    id: 'stage-4',
    nameKo: '마루',
    nameEn: 'Wooden Floor',
    shortTag: '04. 마루',
    color: darkPalette.hwanggeum[500],
    desc: '땅바닥에서 일정 높이를 띄워 기둥과 귀틀을 짜 맞춘 뒤 널판을 덮어 시공하는 쾌적한 휴식 및 통풍 공간입니다. 온돌이 취침을 위한 닫힌 공간이라면, 마루는 덥고 습한 여름철을 나기 위한 열린 공간으로 작용합니다. 대청마루, 툇마루 등 위치에 따라 방과 방, 집 안과 마당을 자연스럽게 이어주는 매개체 역할을 합니다.',
    detail: '',
    meshKeywords: ['Maru', 'Floor'],
    cameraPos: [6, 2.4, 6],
    cameraTarget: [0, 2.2, 0],
    fov: 40,
    from: [0, -12, 0],
  },
  {
    step: 5,
    id: 'stage-5',
    nameKo: '벽',
    nameEn: 'Wall',
    shortTag: '05. 벽',
    color: darkPalette.cheongrok[400],
    desc: '기둥과 보가 하중을 전적으로 지탱하는 전통 목조 구조에서 벽은 무게를 견디는 대신 공간을 분리하는 데 집중합니다. 흙반죽에 돌이나 나무를 섞거나 거푸집으로 다져 쌓는 방식으로 뛰어난 자연 내구성을 확보합니다. 필요에 따라 구조를 쉽게 트거나 닫을 수 있어 유연하고 자유로운 공간 배치가 가능합니다.',
    detail: '',
    meshKeywords: ['Wall'],
    cameraPos: [0, 3.8, 17],
    cameraTarget: [0, 3.2, 0],
    fov: 44,
    from: [0, 20, 0],
  },
  {
    step: 6,
    id: 'stage-6',
    nameKo: '창호',
    nameEn: 'Windows and Doors',
    shortTag: '06. 창호',
    color: darkPalette.kobalt[400],
    desc: '채광과 환기를 담당하는 창(窓)과 사람의 출입을 위한 지게문(戶)을 아우르는 건축 요소입니다. 띠살창, 정자살창 등 섬세한 살짜임새를 통해 한옥 특유의 조형미를 보여주며, 여닫이와 미닫이, 들어열개 등 공간에 맞춘 다채로운 개폐 방식을 지원합니다. 계절의 변화에 맞춰 공간을 개방하거나 닫아 자연과의 경계를 조율합니다.',
    detail: '',
    meshKeywords: ['Door', 'Win', 'Joo'],
    cameraPos: [3.5, 3.0, 5],
    cameraTarget: [0, 2.8, 0],
    fov: 32,
    from: [0, 15, 0],
  },
  {
    step: 7,
    id: 'stage-7',
    nameKo: '기와',
    nameEn: 'Roof Tiles',
    shortTag: '07. 기와',
    color: darkPalette.jangmi[500],
    desc: '틀에 넣은 점토를 가마에서 구워낸 지붕 마감재로, 눈비의 침수를 막아 목조건물의 부식을 완벽히 차단합니다. 암키와와 수키와를 정교하게 엮어 빗물을 자연스럽게 흘려보내도록 설계되었습니다. 처마 끝의 막새와 용마루의 치미 등 다채로운 장식 기와를 더해 건축물의 웅장함과 의장적 가치를 끌어올립니다.',
    detail: '',
    meshKeywords: ['Roof'],
    cameraPos: [18, 9.0, 20],
    cameraTarget: [-0.8, 3.1, -0.6],
    mobileCameraTarget: [0.2, 3.9, -0.6],
    fov: 45,
    from: [0, 40, 0],
  },
];

