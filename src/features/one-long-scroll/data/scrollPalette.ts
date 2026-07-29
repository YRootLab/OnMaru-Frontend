import { hexToRgb, type ColorStop } from '../utils/lerpColor';

/**
 * [테스트용] 스크롤 진행도에 따른 배경색 정지점.
 * 진행도가 실제로 전 구간에 걸쳐 흐르는지 눈으로 확인하기 위한 값이므로,
 * 연출이 확정되면 이 배열만 교체하면 된다.
 */
export const BACKGROUND_STOPS: ColorStop[] = [
  { at: 0.0, color: hexToRgb('#0A0908') }, // 검정
  { at: 0.5, color: hexToRgb('#F7F2E9') }, // 베이지
  { at: 1.0, color: hexToRgb('#6BA3D4') }, // 파랑
];

/** 캔버스가 마운트되기 전 화면을 채울 시작 색. BACKGROUND_STOPS[0]과 같아야 한다. */
export const BACKGROUND_START_HEX = '#0A0908';
