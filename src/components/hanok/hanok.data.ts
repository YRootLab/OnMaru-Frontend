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
