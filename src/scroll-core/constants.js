/**
 * OnMaru 3D 스크롤 경험 전역 상수 정의
 */

export const MODEL_URL = '/anchae.glb';

export const SCROLL_HEIGHT = '2000vh';

export const BEAT_RANGES = {
  BEAT1: [0.0, 0.09],
  // BEAT2(골격)는 걷어냈다. 남은 범위는 archive/Beat2_Reveal이 참조한다.
  BEAT2: [0.09, 0.2],
  BEAT3: [0.12, 0.38],
  BEAT4: [0.45, 0.7],
  BEAT5: [0.7, 0.82],
  BEAT6: [0.82, 1.0],
};
