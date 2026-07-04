export type CalloutDirection = 'left' | 'right' | 'top' | 'bottom';
export type LayerType = 'roof' | 'structure' | 'pillar' | 'foundation' | 'floor';
export type SpecialEffect = 'ondol' | 'wind' | 'light';
export type TabId = 'exterior' | 'skeleton' | 'interior';

export interface HanokPart {
  id: string;
  tabId: TabId;
  nameKo: string;
  nameEn: string;
  layer: LayerType;
  /** Hotspot dot position (% of image) */
  position: { x: number; y: number };
  /** Where the callout label is placed relative to the dot */
  calloutDirection: CalloutDirection;
  /** Label offset from the dot (px) */
  calloutOffset: { x: number; y: number };
  /** Short description shown in callout label */
  shortDesc: string;
  /** 3-line summary shown in detail panel */
  summary: string[];
  /** Full description for accordion */
  fullDescription: string;
  /** Detail close-up image path */
  detailImageSrc: string;
  /** Special visual effect when selected */
  specialEffect?: SpecialEffect;
  /** Zoom target: which area to zoom into (center %, scale) */
  zoomTarget: { x: number; y: number; scale: number };
}

export interface HanokTab {
  id: TabId;
  label: string;
  labelEn: string;
  imageSrc: string;
  description: string;
}

export const HANOK_TABS: HanokTab[] = [
  {
    id: 'exterior',
    label: '한옥 외관',
    labelEn: 'Exterior View',
    imageSrc: '/images/hanok/hanok-exterior.png',
    description: '기와, 기둥, 마루 등 한옥의 조화로운 외관과 자연 친화적 배치를 살펴봅니다.',
  },
  {
    id: 'skeleton',
    label: '구조와 뼈대',
    labelEn: 'Structure & Frame',
    imageSrc: '/images/hanok/hanok-skeleton.png',
    description: '대들보, 서까래, 용마루 등 한옥을 지탱하는 전통 결구(접합)식 목조 가구 구조입니다.',
  },
  {
    id: 'interior',
    label: '내부와 생활',
    labelEn: 'Interior & Living',
    imageSrc: '/images/hanok/hanok-interior.png',
    description: '아궁이, 마루널, 머름 등 선조들의 지혜가 담긴 따뜻하고 아늑한 생활 공간을 탐색합니다.',
  },
];

export const HANOK_PARTS: HanokPart[] = [
  // ── Tab 1: Exterior ──
  {
    id: 'giwa',
    tabId: 'exterior',
    nameKo: '기와',
    nameEn: 'Giwa (Roof Tile)',
    layer: 'roof',
    position: { x: 50, y: 30 },
    calloutDirection: 'top',
    calloutOffset: { x: 0, y: -70 },
    shortDesc: '자연의 곡선을 품은 처마',
    summary: [
      '기와는 암기와와 수기와의 음양 원리로 배열되어 빗물을 자연스럽게 흘려보냅니다.',
      '처마의 완만한 곡선(현수곡선)은 수학적으로 가장 아름다운 선이자, 빗물을 멀리 튕겨내는 실용적 공학입니다.',
      '한옥 기와의 짙은 청회색은 제조 과정에서 탄소를 흡수해 자연스럽게 만들어지는 색입니다.',
    ],
    fullDescription:
      '기와는 한옥의 가장 상징적인 요소 중 하나입니다. 암키와(오목한 형태)와 수키와(볼록한 형태)가 교대로 배열되어 빗물을 자연스럽게 흘려보내는 배수 시스템을 형성합니다. 처마 끝의 완만한 곡선은 단순히 미적 요소가 아닌, 빗물을 건물 기초에서 멀리 튕겨내는 공학적 설계입니다. 기와의 짙은 청회색은 소성(燒成) 과정에서 환원 분위기로 탄소가 흡착되어 자연적으로 만들어지는 색으로, 인공 착색이 아닌 자연의 화학 반응이 빚어낸 결과물입니다.',
    detailImageSrc: '/images/hanok/giwa-detail.png',
    zoomTarget: { x: 50, y: 30, scale: 1.7 },
  },
  {
    id: 'gidung',
    tabId: 'exterior',
    nameKo: '기둥',
    nameEn: 'Gidung (Pillar)',
    layer: 'pillar',
    position: { x: 43, y: 60 },
    calloutDirection: 'left',
    calloutOffset: { x: -80, y: 0 },
    shortDesc: '하늘과 땅을 잇는 수직의 힘',
    summary: [
      '한옥의 기둥은 배흘림기법(엔타시스)으로 중간이 약간 불룩한데, 이는 시각적 착시를 교정해 더 곧게 보이도록 하는 고대의 지혜입니다.',
      '기둥의 두께와 높이 비율은 수백 년의 경험으로 정립된 황금비율을 따릅니다.',
      '기둥은 지붕의 하중만 받고, 벽은 하중을 받지 않아 창호를 어디든 설치할 수 있습니다.',
    ],
    fullDescription:
      '한옥의 기둥은 단순한 수직 지지대가 아닌, 건축 미학과 구조 공학의 결정체입니다. 배흘림(엔타시스) 기법을 통해 기둥 중간부를 미세하게 불릭하게 만들어, 사람이 아래에서 올려다볼 때 착시 현상으로 가늘어 보이는 것을 보정합니다. 이 기법은 고대 그리스 파르테논 신전의 기둥에서도 발견되는 보편적 건축 지혜입니다. 한옥에서 기둥은 지붕의 하중을 직접 땅으로 전달하는 유일한 구조재이며, 벽체는 하중을 받지 않는 비내력벽으로 설계됩니다.',
    detailImageSrc: '/images/hanok/gidung-detail.png',
    zoomTarget: { x: 43, y: 60, scale: 1.6 },
  },
  {
    id: 'juchutdol',
    tabId: 'exterior',
    nameKo: '주춧돌',
    nameEn: 'Juchutdol (Foundation Stone)',
    layer: 'foundation',
    position: { x: 43, y: 77 },
    calloutDirection: 'bottom',
    calloutOffset: { x: 0, y: 60 },
    shortDesc: '자연을 거스르지 않는 기초',
    summary: [
      '주춧돌은 다듬지 않은 자연석을 그대로 사용합니다. 대신 기둥 밑동을 돌의 울퉁불퉁한 면에 맞춰 정밀하게 깎아내는데, 이를 "그랭이 기법"이라 합니다.',
      '그랭이 기법으로 접합된 기둥과 주춧돌은 접착제 없이도 지진과 강풍에 안전하게 버춥니다.',
      '자연의 형태에 인공물을 맞추는 이 방식은 한국 건축 철학의 핵심: 자연을 이기는 것이 아닌 자연과 어우러지는 것입니다.',
    ],
    fullDescription:
      '주춧돌(礎石)은 한옥 건축에서 자연과의 공존 철학을 가장 극명하게 보여주는 요소입니다. 서양 건축이 돌을 깎아 정교한 기초를 만드는 것과 달리, 한옥은 자연 그대로의 돌을 기초로 사용합니다. 대신 나무 기둥의 밑동을 돌의 울퉁불퉁한 표면에 정밀하게 맞춰 깎아내는 "그랭이 기법"을 사용합니다. 이 접합 방식은 못이나 접착제 없이도 기둥이 주춧돌 위에 안정적으로 서게 합니다.',
    detailImageSrc: '/images/hanok/juchutdol-detail.png',
    zoomTarget: { x: 43, y: 77, scale: 1.8 },
  },
  {
    id: 'maru',
    tabId: 'exterior',
    nameKo: '대청마루',
    nameEn: 'Daecheong Maru (Open Hall)',
    layer: 'floor',
    position: { x: 54, y: 70 },
    calloutDirection: 'right',
    calloutOffset: { x: 80, y: 20 },
    shortDesc: '바람이 쉬어가는 안과 밖의 경계',
    summary: [
      '대청마루는 안방과 건넌방 사이의 개방된 공간으로, 한옥의 여름 냉방 시스템입니다.',
      '앞뒤 문을 모두 열면 앞마당에서 뒷마당으로 바람이 관통하며 자연 환기가 이루어집니다.',
      '"마루"는 온마루 서비스의 어원이 된 공간으로, 내부와 외부, 사람과 사람이 만나는 경계 없는 환대의 장소입니다.',
    ],
    fullDescription:
      '대청마루(大廳—)는 한옥의 중심 공간이자 한국 건축의 핵심 철학을 상징합니다. 안방과 건넌방 사이에 위치한 개방형 나무 바닥 공간으로, 앞뒤로 문을 열면 바람이 건물을 관통하며 자연 냉방을 실현합니다. 마루는 단순한 통로가 아니라, 가족이 모이는 거실이자, 손님을 맞이하는 환대의 공간이며, 내부와 외부의 경계를 허무는 소통의 매개체입니다. "온마루" 서비스의 이름도 이 대청마루에서 비롯되었습니다.',
    detailImageSrc: '/images/hanok/maru-detail.png',
    specialEffect: 'wind',
    zoomTarget: { x: 54, y: 70, scale: 1.6 },
  },
  {
    id: 'changho',
    tabId: 'exterior',
    nameKo: '창호',
    nameEn: 'Changho (Paper Screen Door)',
    layer: 'structure',
    position: { x: 58, y: 56 },
    calloutDirection: 'right',
    calloutOffset: { x: 80, y: -20 },
    shortDesc: '빛을 거르는 한지의 과학',
    summary: [
      '창호지(한지)는 단순히 빛을 막는 것이 아니라 빛을 산란시켜 방 안으로 은은하고 고른 조명을 제공합니다.',
      '한지는 수천 개의 미세한 구멍이 있어 공기를 통과시키면서도 소리와 바람을 차단하는 반투과성 소재입니다.',
      '겨울엔 단열재, 여름엔 통풍구가 되는 창호는 한옥의 스마트한 패시브 에너지 시스템입니다.',
    ],
    fullDescription:
      '창호(窓戶)는 한옥의 "스마트 윈도우"입니다. 나무 살대로 기하학적 문양(문살)을 만들고 그 위에 한지를 바릅니다. 한지는 닥나무 섬유로 만들어지며, 수천 개의 미세한 구멍이 있어 공기를 자연스럽게 순환시킵니다. 또한 빛이 한지를 통과할 때 산란되어 방 안에 은은하고 고른 조명을 제공합니다. 여름에는 창호를 활짝 열어 통풍을 시키고, 겨울에는 한지의 단열 효과로 보온을 유지하는 계절 적응형 시스템입니다.',
    detailImageSrc: '/images/hanok/changho-detail.png',
    specialEffect: 'light',
    zoomTarget: { x: 58, y: 56, scale: 1.7 },
  },

  // ── Tab 2: Skeleton ──
  {
    id: 'yongmaru',
    tabId: 'skeleton',
    nameKo: '용마루',
    nameEn: 'Yongmaru (Roof Ridge)',
    layer: 'roof',
    position: { x: 32, y: 8 },
    calloutDirection: 'left',
    calloutOffset: { x: -80, y: -20 },
    shortDesc: '하늘과 지붕이 만나는 선',
    summary: [
      '한옥 지붕의 맨 꼭대기에 수평으로 얹은 마루로, 건물의 중심축을 형성합니다.',
      '양끝을 위로 살짝 올려 부드러우면서도 강인한 곡선의 전통 실루엣을 만듭니다.',
      '내부 목조 가구와 기둥이 모이는 최상단 하중점을 빗물로부터 보호하는 덮개 역할을 합니다.',
    ],
    fullDescription:
      '용마루는 한옥 지붕의 뼈대를 이루는 최상단의 수평 축이자, 기와의 하중이 양쪽으로 나뉘는 기점입니다. 한옥 고유의 수려한 곡선미를 대표하며, 기둥에서 시작된 수직 부재들이 서까래와 대공을 거쳐 이 용마루로 수렴합니다. 미적 가치와 함께 기와지붕 틈새로 빗물이 침투하는 것을 차단하는 고도의 방수 목적을 가집니다.',
    detailImageSrc: '/images/hanok/giwa-detail.png',
    zoomTarget: { x: 32, y: 8, scale: 1.8 },
  },
  {
    id: 'bugo_chakgo',
    tabId: 'skeleton',
    nameKo: '부고와 착고',
    nameEn: 'Bugo & Chakgo',
    layer: 'roof',
    position: { x: 33, y: 13 },
    calloutDirection: 'left',
    calloutOffset: { x: -80, y: 10 },
    shortDesc: '기와 틈새를 메우는 마감의 묘미',
    summary: [
      '착고는 용마루 밑의 오목한 기와(암기와) 틈을 메워주는 단단한 흙과 기와 조각입니다.',
      '부고는 착고 위에 얹혀 용마루의 든든한 기초를 형성하는 기와 층입니다.',
      '비바람과 곤충의 침입을 완벽히 차단하며 지붕 최상단의 구조적 안정감을 배가합니다.',
    ],
    fullDescription:
      '부고와 착고는 한옥 기와지붕의 최상단 마감 부분에 적용되는 전통 공법입니다. 용마루 아래 암기와가 겹치는 부분의 빈틈을 기와 조각과 회반죽(진흙)을 채워 넣는 것을 "착고"라 하며, 그 위에 다시 마감 기와를 수평으로 쌓아 용마루의 단단한 밑받침 역할을 하는 것을 "부고"라고 합니다. 지붕 틈새로 비바람이 스며드는 것을 원천 차단하는 지혜가 담겨 있습니다.',
    detailImageSrc: '/images/hanok/giwa-detail.png',
    zoomTarget: { x: 33, y: 13, scale: 1.8 },
  },
  {
    id: 'daegong',
    tabId: 'skeleton',
    nameKo: '대공',
    nameEn: 'Daegong (Ridge Post)',
    layer: 'structure',
    position: { x: 40, y: 33 },
    calloutDirection: 'left',
    calloutOffset: { x: -70, y: 0 },
    shortDesc: '종보 위에서 용마루를 받치는 기둥',
    summary: [
      '대공은 보(대들보, 종보) 위에 수직으로 세워져 지붕의 가장 높은 하중을 전달하는 동자 기둥입니다.',
      '판자를 겹쳐 만든 판대공, 파이프 모양의 동자대공 등 다양한 디자인으로 조각미를 살립니다.',
      '상부 구조의 마지막 무게를 하부 대들보와 기둥으로 분산하는 중추적 노드입니다.',
    ],
    fullDescription:
      '대공(大工)은 들보 위에서 지붕 마루를 받치는 동자기둥입니다. 한옥 가구(架構) 구조의 최상부에 위치하며, 종보(가장 윗단의 들보) 중간에 세워져 종도리와 용마루의 막대한 하중을 지탱합니다. 판자 모양을 겹치거나 나뭇가지 모양(포대공), 기하학적 형태 등으로 아름답게 조각되어 내부에서 올려다볼 때 수려한 장식적 효과를 자아내기도 합니다.',
    detailImageSrc: '/images/hanok/gidung-detail.png',
    zoomTarget: { x: 40, y: 33, scale: 1.8 },
  },
  {
    id: 'daedeulbo',
    tabId: 'skeleton',
    nameKo: '대들보',
    nameEn: 'Daedeulbo (Main Beam)',
    layer: 'structure',
    position: { x: 46, y: 49 },
    calloutDirection: 'bottom',
    calloutOffset: { x: 0, y: 50 },
    shortDesc: '건물의 중심을 잡아주는 대들보',
    summary: [
      '기둥과 기둥 사이에 가로질러 얹은 두껍고 튼튼한 나무 보로, 건물의 뼈대를 고정합니다.',
      '나무의 자연스러운 곡선미를 그대로 살려 조형미와 하중 극복을 동시에 달성합니다.',
      '서까래와 종보에서 타고 내려온 지붕 전체의 무게를 사방 기둥으로 균등 배분합니다.',
    ],
    fullDescription:
      '대들보(大樑)는 한옥 구조의 중추를 이루는 가장 크고 굵은 수평 부재입니다. 앞 기둥과 뒷 기둥을 연결하며, 지붕 전체의 막대한 하중을 한 몸에 받아 기둥으로 전달합니다. 인위적으로 나무를 일자로 깎아 쓰지 않고, 자연적인 나무의 휨과 두께를 그대로 보존하여 역학적 지지력และ 자연스러운 유기적 미학을 극대화합니다.',
    detailImageSrc: '/images/hanok/maru-detail.png',
    zoomTarget: { x: 46, y: 49, scale: 1.6 },
  },
  {
    id: 'seokkarae',
    tabId: 'skeleton',
    nameKo: '서까래',
    nameEn: 'Seokkarae (Rafter)',
    layer: 'structure',
    position: { x: 65, y: 38 },
    calloutDirection: 'right',
    calloutOffset: { x: 80, y: -20 },
    shortDesc: '하늘로 뻗어나가는 처마의 날개',
    summary: [
      '도리 위에 비스듬히 얹어 지붕을 구성하는 길고 둥근 통나무 목재입니다.',
      '일정한 간격으로 촘촘히 배열되어 처마를 부드럽게 밖으로 밀어냅니다.',
      '기후 변화에 대응하여 여름의 뜨거운 햇빛을 차단하고 빗물의 낙수를 건물 밖으로 보냅니다.',
    ],
    fullDescription:
      '서까래(椽木)는 도리와 도리 사이에 촘촘하게 얹히는 서까래 나무들로, 기와지붕 밑바닥을 형성합니다. 부드럽고 가늘며 긴 원목을 그대로 사용하여 내부 천장에서 바라볼 때 평화로운 갈빗대 모양의 서까래 레이아웃을 제공합니다. 처마가 건물 벽체 바깥으로 1~2m 넘게 뻗어나갈 수 있도록 지탱해주어 벽체의 부식을 막습니다.',
    detailImageSrc: '/images/hanok/giwa-detail.png',
    zoomTarget: { x: 65, y: 38, scale: 1.7 },
  },
  {
    id: 'jongdori',
    tabId: 'skeleton',
    nameKo: '종도리',
    nameEn: 'Jongdori (Ridge Purlin)',
    layer: 'structure',
    position: { x: 40, y: 26 },
    calloutDirection: 'right',
    calloutOffset: { x: 70, y: -10 },
    shortDesc: '지붕 뼈대의 최상단 수평 버팀목',
    summary: [
      '지붕 뼈대의 최고층에 놓이는 도리로, 서까래 상단부가 여기에 와서 고정됩니다.',
      '마룻대라고도 부르며, 상량식 때 "상량문"을 기록하여 건물의 역사를 담아두는 목재입니다.',
      '건축물의 수평적 흔들림(횡력)을 제어하고 대공과 연결되어 지붕 전체를 엮어줍니다.',
    ],
    fullDescription:
      '종도리(宗道里)는 건물의 최상부인 용마루 아래에 위치하는 가장 중요한 수평 도리입니다. 서까래의 머리 부분이 여기에 걸쳐 안착됩니다. 건물을 지을 때 가장 마지막으로 올리는 부재로, 상량판(상량글을 적은 판)을 이곳에 봉안하여 건물의 영원한 안녕과 건축 연도를 박제해둡니다.',
    detailImageSrc: '/images/hanok/juchutdol-detail.png',
    zoomTarget: { x: 40, y: 26, scale: 1.8 },
  },

  // ── Tab 3: Interior ──
  {
    id: 'agungi_ondol',
    tabId: 'interior',
    nameKo: '아궁이와 온돌',
    nameEn: 'Agungi & Ondol',
    layer: 'floor',
    position: { x: 74, y: 69 },
    calloutDirection: 'right',
    calloutOffset: { x: 80, y: -20 },
    shortDesc: '불을 지펴 바닥을 데우는 난방의 근원',
    summary: [
      '아궁이는 부엌에서 땔감을 때어 가마솥을 데우고, 그 뜨거운 연기를 방바닥 밑으로 보냅니다.',
      '구들장을 달군 열기는 오랜 시간 동안 방 전체에 복사열을 제공하여 훈훈함을 유지합니다.',
      '취사와 난방을 단 하나의 열원으로 동시 해결한 세계 최고의 다목적 에너지 친화 구조입니다.',
    ],
    fullDescription:
      '아궁이는 전통 한옥의 에너지 허브였습니다. 부엌 아궁이에서 군불을 때어 가마솥으로 밥을 지음과 동시에, 그때 발생하는 연기와 열기를 방바닥 밑으로 뚫린 "고래"로 유도하여 방바닥의 돌(구들장)을 데웠습니다. 돌의 높은 열용량을 이용해 아궁이 불이 꺼진 뒤에도 반나절 이상 온기를 간직하는 지속가능한 스마트 난방 솔루션입니다.',
    detailImageSrc: '/images/hanok/ondol-detail.png',
    specialEffect: 'ondol',
    zoomTarget: { x: 74, y: 69, scale: 1.6 },
  },
  {
    id: 'maruneol',
    tabId: 'interior',
    nameKo: '마루널',
    nameEn: 'Maruneol (Floorboards)',
    layer: 'floor',
    position: { x: 26, y: 68 },
    calloutDirection: 'left',
    calloutOffset: { x: -80, y: 20 },
    shortDesc: '나무의 결이 살아 숨 쉬는 우물마루',
    summary: [
      '짧은 널과 긴 널을 짜 맞춰 우물(井) 정 자 모양을 만드는 전통 우물마루입니다.',
      '나무의 수축과 팽창을 고려하여 못을 쓰지 않고 끼워 맞춰 틈이 벌어지면 다시 모아 짤 수 있습니다.',
      '바닥 아래의 찬 공기가 틈새로 미세하게 통풍되어 여름을 시원하게 해주는 냉방 인프라입니다.',
    ],
    fullDescription:
      '한옥의 마루널은 대청바닥을 까는 나무 판재들입니다. 특히 한국 특유의 "우물마루" 공법은 가로지르는 장귀틀과 세로로 끼워 넣는 동귀틀을 엇갈려 짜서 바둑판 모양을 냅니다. 나무가 계절마다 늘어나고 줄어드는 특성을 지혜롭게 극대화하여, 못을 쓰지 않고 널판을 끼워 둠으로써 나무가 뒤틀어지거나 깨지는 현상을 완벽히 차단합니다.',
    detailImageSrc: '/images/hanok/maru-detail.png',
    specialEffect: 'wind',
    zoomTarget: { x: 26, y: 68, scale: 1.6 },
  },
  {
    id: 'meoreum',
    tabId: 'interior',
    nameKo: '머름',
    nameEn: 'Meoreum (Window Sill)',
    layer: 'structure',
    position: { x: 60, y: 46 },
    calloutDirection: 'right',
    calloutOffset: { x: 80, y: 10 },
    shortDesc: '바깥 경치를 담는 심리적 프레임',
    summary: [
      '방바닥과 창문 사이에 낮게 쌓아 올린 나무 울타리(턱)입니다.',
      '사람이 턱을 괴고 엎드리거나 팔을 기댔을 때 인체공학적으로 가장 편안한 높이(약 30~45cm)로 제작됩니다.',
      '문을 열었을 때 찬 바람이 바닥으로 바로 치고 들어오는 것을 막는 공기 대류 차단벽입니다.',
    ],
    fullDescription:
      '머름(머름대)은 방바닥과 외부 창호 사이에 설치하는 나지막한 목재 울타리 턱입니다. 기둥 사이에 머름대를 댐으로써 시각적으로 방의 아늑함을 확보하고, 바람이 바닥으로 곧바로 부는 것을 막는 차단벽 역할을 합니다. 또한 문을 열고 마당을 바라볼 때 턱에 팔을 걸쳐 앉기 편하도록 인간 공학적인 신체 스케일에 맞추어 정밀하게 설계되었습니다.',
    detailImageSrc: '/images/hanok/changho-detail.png',
    zoomTarget: { x: 60, y: 46, scale: 1.8 },
  },
  {
    id: 'deulchang',
    tabId: 'interior',
    nameKo: '들쇠와 들창',
    nameEn: 'Deulchang (Hanging Window)',
    layer: 'structure',
    position: { x: 44, y: 43 },
    calloutDirection: 'left',
    calloutOffset: { x: -80, y: -30 },
    shortDesc: '천장에 들어 걸어 여는 가변형 벽체',
    summary: [
      '창문을 들어 올려 처마 아래 들쇠(쇠갈고리)에 고정함으로써 벽면 전체를 개방합니다.',
      '더운 여름철 대청마루 and 앞마당을 하나로 묶어 막힘없는 통풍을 선사합니다.',
      '필요에 따라 방과 마루를 개별 격리하거나 광활하게 통합하는 가변형 공간 스위치입니다.',
    ],
    fullDescription:
      '들창(들문)은 창이나 문을 천장이나 처마 끝에 설치된 "들쇠(걸이쇠)"에 수평으로 들어 걸어 고정하는 가변형 개폐문입니다. 여름철 더위를 이기기 위해 벽면 전체를 위로 완전히 들어 올려버려 마루와 마당을 장벽 없이 병합합니다. 자연을 실내로 적극 수용하고 통풍을 유도하는 한옥의 독창적이고 스마트한 가변 공간 설계입니다.',
    detailImageSrc: '/images/hanok/changho-detail.png',
    specialEffect: 'light',
    zoomTarget: { x: 44, y: 43, scale: 1.7 },
  },
  {
    id: 'munseolju',
    tabId: 'interior',
    nameKo: '문설주',
    nameEn: 'Munseolju (Doorpost)',
    layer: 'structure',
    position: { x: 30, y: 44 },
    calloutDirection: 'left',
    calloutOffset: { x: -70, y: -20 },
    shortDesc: '창문과 문짝을 곧게 세우는 기둥',
    summary: [
      '문이나 창의 좌우에 세워 문짝을 지탱하고 고정해주는 나무 기둥 틀입니다.',
      '나무 프레임의 틀어짐을 잡아주어 한지가 발린 여닫이문이 항상 부드럽게 열고 닫히게 합니다.',
      '기둥과 벽체를 잇는 결합 구조로, 문틀의 흔들림을 원천 방지하는 든든한 뼈대입니다.',
    ],
    fullDescription:
      '문설주(門-柱)는 문짝이나 창문짝을 달아매기 위해 좌우에 세운 기둥 틀입니다. 여닫이문이나 미닫이문이 여닫힐 때 발생하는 지속적인 동적 충격을 지탱하며, 세월이 흘러 목재 기둥이나 상부 들보가 미세하게 가라앉아 문틀이 찌그러지는 현상을 막아 영구적인 개폐가 가능하게 해줍니다.',
    detailImageSrc: '/images/hanok/gidung-detail.png',
    zoomTarget: { x: 30, y: 44, scale: 1.7 },
  },
];
