export type CalloutDirection = 'left' | 'right' | 'top' | 'bottom';
export type LayerType = 'roof' | 'skeleton' | 'walls' | 'floor' | 'foundation';
export type SpecialEffect = 'ondol' | 'wind' | 'light';

export interface HanokLayerConfig {
  id: LayerType;
  imageSrc: string;
  zIndex: number;
  /** Maximum Y-axis offset when fully exploded (px) */
  maxPlayOffset: number;
  label: string;
}

export interface HanokPart {
  id: string;
  layer: LayerType;
  nameKo: string;
  nameEn: string;
  /** Hotspot dot position (% of image layer width/height) */
  position: { x: number; y: number };
  calloutDirection: CalloutDirection;
  calloutOffset: { x: number; y: number };
  shortDesc: string;
  summary: string[];
  fullDescription: string;
  detailImageSrc: string;
  specialEffect?: SpecialEffect;
  zoomTarget: { x: number; y: number; scale: number };
}

export const HANOK_LAYERS: HanokLayerConfig[] = [
  {
    id: 'roof',
    imageSrc: '/images/hanok/exploded/layer_roof.png',
    zIndex: 50,
    maxPlayOffset: -180,
    label: '지붕 레이어 (기와)',
  },
  {
    id: 'skeleton',
    imageSrc: '/images/hanok/exploded/layer_skeleton.png',
    zIndex: 40,
    maxPlayOffset: -80,
    label: '골조 레이어 (대들보)',
  },
  {
    id: 'walls',
    imageSrc: '/images/hanok/exploded/layer_walls.png',
    zIndex: 30,
    maxPlayOffset: 10,
    label: '벽체 레이어 (창호)',
  },
  {
    id: 'floor',
    imageSrc: '/images/hanok/exploded/layer_floor.png',
    zIndex: 20,
    maxPlayOffset: 100,
    label: '바닥 레이어 (대청마루)',
  },
  {
    id: 'foundation',
    imageSrc: '/images/hanok/exploded/layer_foundation.png',
    zIndex: 10,
    maxPlayOffset: 190,
    label: '기단 레이어 (주춧돌)',
  },
];

export const HANOK_PARTS: HanokPart[] = [
  {
    id: 'giwa',
    layer: 'roof',
    nameKo: '기와',
    nameEn: 'Giwa (Roof Tile)',
    position: { x: 50, y: 35 },
    calloutDirection: 'top',
    calloutOffset: { x: 0, y: -70 },
    shortDesc: '자연의 곡선을 품은 처마',
    summary: [
      '기와는 암기와와 수기와의 음양 원리로 배열되어 빗물을 자연스럽게 흘려보냅니다.',
      '처마의 완만한 곡선은 수학적으로 가장 아름다운 선이자, 빗물을 멀리 튕겨내는 실용적 공학입니다.',
      '한옥 기와의 짙은 청회색은 제조 과정에서 탄소를 흡수해 자연스럽게 만들어지는 색입니다.',
    ],
    fullDescription:
      '기와는 한옥의 가장 상징적인 요소 중 하나입니다. 암키와(오목한 형태)와 수키와(볼록한 형태)가 교대로 배열되어 빗물을 자연스럽게 흘려보내는 배수 시스템을 형성합니다. 처마 끝의 완만한 곡선은 단순히 미적 요소가 아닌, 빗물을 건물 기초에서 멀리 튕겨내는 공학적 설계입니다.',
    detailImageSrc: '/images/hanok/giwa-detail.png',
    zoomTarget: { x: 50, y: 35, scale: 1.8 },
  },
  {
    id: 'daedeulbo',
    layer: 'skeleton',
    nameKo: '대들보',
    nameEn: 'Daedeulbo (Main Beam)',
    position: { x: 50, y: 52 },
    calloutDirection: 'left',
    calloutOffset: { x: -90, y: -10 },
    shortDesc: '건물의 중심을 잡아주는 대들보',
    summary: [
      '기둥과 기둥 사이에 가로질러 얹은 두껍고 튼튼한 나무 보로, 건물의 뼈대를 고정합니다.',
      '나무의 자연스러운 곡선미를 그대로 살려 조형미와 하중 극복을 동시에 달성합니다.',
      '지붕 전체의 무게를 사방 기둥으로 균등 배분하는 가구 구조의 중추입니다.',
    ],
    fullDescription:
      '대들보는 한옥 구조의 중추를 이루는 가장 크고 굵은 수평 부재입니다. 앞 기둥과 뒷 기둥을 연결하며, 지붕 전체의 막대한 하중을 한 몸에 받아 기둥으로 전달합니다. 자연적인 나무의 휨과 두께를 그대로 보존합니다.',
    detailImageSrc: '/images/hanok/maru-detail.png',
    zoomTarget: { x: 50, y: 52, scale: 1.8 },
  },
  {
    id: 'changho',
    layer: 'walls',
    nameKo: '창호',
    nameEn: 'Changho (Paper Screen Door)',
    position: { x: 50, y: 56 },
    calloutDirection: 'right',
    calloutOffset: { x: 80, y: -20 },
    shortDesc: '빛을 거르는 한지의 과학',
    summary: [
      '창호지(한지)는 단순히 빛을 막는 것이 아니라 빛을 산란시켜 방 안으로 은은한 조명을 제공합니다.',
      '한지는 수천 개의 미세한 구멍이 있어 공기를 통과시키면서도 소리와 바람을 차단합니다.',
      '여름엔 통풍구, 겨울엔 단열재가 되는 한옥의 스마트 패시브 에너지 시스템입니다.',
    ],
    fullDescription:
      '창호는 한옥의 스마트 윈도우입니다. 나무 살대로 기하학적 문양을 만들고 그 위에 한지를 바릅니다. 한지는 공기를 자연스럽게 순환시키면서 단열과 채광을 돕는 친환경 필터 역할을 합니다.',
    detailImageSrc: '/images/hanok/changho-detail.png',
    specialEffect: 'light',
    zoomTarget: { x: 50, y: 56, scale: 1.7 },
  },
  {
    id: 'ondol',
    layer: 'floor',
    nameKo: '온돌과 마루',
    nameEn: 'Ondol & Daecheong',
    position: { x: 50, y: 55 },
    calloutDirection: 'right',
    calloutOffset: { x: 80, y: 20 },
    shortDesc: '불과 바람의 조화: 냉난방 인프라',
    summary: [
      '아궁이의 열기는 바닥 구들장을 데우고(온돌), 앞뒤 문을 열면 시원한 바람이 관통합니다(대청마루).',
      '뜨거운 공기가 아닌 바닥 복사열로 난방하는 온돌은 현대 과학이 증명한 가장 건강한 방식입니다.',
      '여름의 시원함(마루)과 겨울의 따뜻함(온돌)이 공존하는 한옥 고유의 가변형 냉난방입니다.',
    ],
    fullDescription:
      '온돌은 아궁이의 뜨거운 연기가 바닥 구들장을 달궈 난방하는 복사열 시스템입니다. 대청마루는 바람의 통로가 되어 한옥이 고온다습한 여름과 혹한의 겨울을 현명하게 극복하도록 돕습니다.',
    detailImageSrc: '/images/hanok/ondol-detail.png',
    specialEffect: 'ondol',
    zoomTarget: { x: 50, y: 55, scale: 1.7 },
  },
  {
    id: 'juchutdol',
    layer: 'foundation',
    nameKo: '주춧돌',
    nameEn: 'Juchutdol (Foundation Stone)',
    position: { x: 50, y: 45 },
    calloutDirection: 'bottom',
    calloutOffset: { x: 0, y: 50 },
    shortDesc: '자연석 위에 결합되는 기초',
    summary: [
      '다듬지 않은 자연석에 나무 기둥 밑동을 맞춰 깎는 "그랭이 기법"을 사용합니다.',
      '그랭이 기법으로 밀착된 기둥은 못이 없어도 지진과 강풍의 횡력을 견뎌냅니다.',
      '인공물을 자연에 맞추는 한국 전통 건축의 자연 공존 철학의 상징입니다.',
    ],
    fullDescription:
      '주춧돌은 한옥 건축에서 자연과의 공존 철학을 가장 극명하게 보여줍니다. 자연석 표면의 기복대로 나무 밑동을 깎아 얹어 일체화하는 그랭이 기법은 지반 침하나 지진에도 기둥이 탈탈 털리지 않게 하는 내진 설계입니다.',
    detailImageSrc: '/images/hanok/juchutdol-detail.png',
    zoomTarget: { x: 50, y: 45, scale: 1.8 },
  },
];
