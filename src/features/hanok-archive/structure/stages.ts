// 한옥 7단계 조립 부재 정의.
// src/temp/archive/hanok-viewer/data/hanok.data.ts 의 STAGES 를 도감으로 들여온 사본이다.
// (아카이브는 읽기 전용이라 참조 대신 복사해 왔다.)

import { darkPalette } from '@/design-system/tokens';

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

/**
 * 메시 하나가 어느 켜에 속하는지.
 *
 * 모델의 107개 이름이 전부 keyword로 걸린다(SM_Baeryeom_Pillar_01A_003 → 초석과 기둥).
 * 전수 확인했고 미매칭은 0이지만, 모델이 갈릴 수 있으므로 못 찾으면 -1을 돌려준다.
 * 조립 패널은 여기에 더해 높이로 떨어뜨리는 폴백을 갖는다 — 그쪽은 부재 하나도
 * 빠뜨리면 안 되고, 이쪽은 누른 것을 못 읽으면 아무 일도 안 일어나면 그만이다.
 */
export function stageIndexForMesh(meshName: string): number {
  const name = meshName.toLowerCase();
  return STAGES.findIndex((stage) =>
    stage.meshKeywords.some((keyword) => name.includes(keyword.toLowerCase())),
  );
}

export const STAGES: HanokStageData[] = [
  {
    step: 1,
    id: 'stage-1',
    nameKo: '기단',
    nameEn: 'Stylobate',
    shortTag: '01. 기단',
    color: darkPalette.juhong[200],
    desc: '터보다 한 단 높인 기초예요. 건물의 무게를 땅에 고르게 나눠주고, **빗물과 지하수로부터 집을 지켜줍니다**. 흙과 돌을 층층이 쌓아 올리는 방식으로, 삼국시대부터 한옥에 꼭 있던 자리예요. 단을 얼마나 높이 쌓느냐에 따라 건물의 무게감도 달라집니다.',
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
    desc: '마루는 열기를 피하고 바람이 잘 통하도록 땅에서 높이 띄워 지어요. 댓돌은 그 **마루와 땅 사이 높이 차를 이어주는 디딤돌**입니다. 따로 현관 없이 여기서 신발을 벗고 바로 마루로 올라가는 게 한옥의 방식이에요. 안과 밖을 잇는 계단이자, 걷는 다리를 덜어주는 쉼터이기도 합니다.',
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
    desc: '초석은 기둥을 타고 내려오는 지붕의 무게를 땅으로 흘려보내는 돌이에요. 건물이 사라져도 초석이 남아 있으면, 그 배열만으로 원래 모습을 짐작할 수 있습니다. 기둥은 그 위에 서는 수직 뼈대고요. 가운데를 살짝 부풀린 배흘림 기둥처럼, 모양 자체로 멋을 더하기도 합니다. 귀퉁이 기둥을 살짝 높이고 안쪽으로 기울이는 **귀솟음과 안쏠림 기법 덕분에, 눈으로 보면 반듯하고 구조는 더 단단합니다**.',
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
    desc: '땅에서 높이 띄우고, 기둥과 귀틀을 짜 맞춘 뒤 널판을 깔아 만들어요. 온돌이 잠을 자는 닫힌 공간이라면, 마루는 **덥고 습한 여름을 나는 열린 공간**입니다. 대청마루, 툇마루처럼 자리에 따라 이름이 다르고, 방과 방을, 집 안과 마당을 자연스럽게 이어줍니다.',
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
    desc: '한옥은 기둥과 보가 무게를 전부 떠받쳐요. 그래서 벽은 무게를 견디는 대신, **공간을 나누는 일에만 집중합니다**. 흙에 돌이나 나무를 섞어 다지면 자연스럽게 튼튼해지고요. 무게를 신경 쓰지 않아도 되니, 필요에 따라 쉽게 트고 닫으며 공간을 자유롭게 쓸 수 있습니다.',
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
    color: darkPalette.juhong[400],
    desc: '빛과 바람을 들이는 창(窓), 사람이 드나드는 문(戶)을 함께 이르는 말이에요. 띠살, 정자살처럼 섬세한 살 무늬가 한옥만의 멋을 만들고, 여닫이·미닫이·들어열개처럼 다양한 여닫는 방식을 공간에 맞춰 씁니다. **계절에 따라 열고 닫으며 자연과의 거리를 조절하는 장치**이기도 해요.',
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
    desc: '흙을 틀에 넣고 가마에서 구운 지붕 마감재예요. 눈비가 스미는 걸 막아 **나무로 지은 몸체가 썩지 않게 지켜줍니다**. 오목한 암키와와 볼록한 수키와를 정교하게 맞물려 빗물이 자연스럽게 흘러내리도록 했고요. 처마 끝 막새기와, 용마루의 치미 같은 장식까지 더해 건물의 품격을 완성합니다.',
    detail: '',
    meshKeywords: ['Roof'],
    cameraPos: [18, 9.0, 20],
    cameraTarget: [-0.8, 3.1, -0.6],
    mobileCameraTarget: [0.2, 3.9, -0.6],
    fov: 45,
    from: [0, 40, 0],
  },
];
