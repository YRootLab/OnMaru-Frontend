/**
 * OnMaru 3D 스크롤 경험 전역 상수 정의
 */

export const MODEL_URL = '/anchae.glb';

export const SCROLL_HEIGHT = '2000vh';

export const BEAT_RANGES = {
  BEAT1: [0.0, 0.10],
  BEAT2: [0.10, 0.12],
  BEAT3: [0.10, 0.22], // 24절기 슬라이더 구간 슬림화!
  BEAT4: [0.22, 0.58], // 7단계 조립 구간이 훨씬 빨리 쾌적하게 등장!
  BEAT5: [0.58, 0.76],
  BEAT6: [0.76, 1.0],
};
