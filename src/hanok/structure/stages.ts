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
