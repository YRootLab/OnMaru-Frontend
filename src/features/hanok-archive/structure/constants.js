/** 한옥도감 3D 구조 섹션 상수 */

export const MODEL_URL = '/anchae.glb';

/**
 * 씬의 카메라 구도는 랜딩에서 쓰던 진행도 기반 SHOTS를 그대로 물려받았다.
 * 모달에는 스크롤이 없으므로 각 장면이 자기 구간의 진행도를 상수로 또는
 * 단계 진행도에서 환산해 건넨다.
 */
export const SHADOW_RANGE = [0.0, 0.44];
export const ASSEMBLY_RANGE = [0.48, 0.96];
