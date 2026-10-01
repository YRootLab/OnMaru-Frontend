import { keyframes } from '@emotion/react';

/**
 * 온마루 인터랙티브 모달 & 상세창 이징 시스템
 *
 * 특성:
 * 1. 빠르게 시작해 초기 반응성을 극대화 (Fast initial rise)
 * 2. 부드럽게 감속하여 눈의 피로와 부담을 덜어냄 (Smooth deceleration)
 * 3. 끝단에 약 2~4%의 섬세한 반동(Overshoot bounce)을 더해 생기와 촉각적 피드백 제공 (Subtle lively spring bounce)
 */

export const LIVELY_MODAL_CUBIC_BEZIER = 'cubic-bezier(0.19, 1.15, 0.22, 1)';
export const LIVELY_MODAL_EASE = [0.19, 1.15, 0.22, 1] as const;

/**
 * 데스크톱 모달 카드용 Framer Motion 스프링
 */
export const livelyModalSpring = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 24,
  mass: 0.85,
};

/**
 * 모바일 바텀시트 / 드로어용 Framer Motion 스프링
 */
export const livelyBottomSheetSpring = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 25,
  mass: 0.88,
};

/**
 * 모달 닫힘(Exit) 시 빠르고 깔끔한 퇴장 트랜지션
 */
export const modalExitTransition = {
  duration: 0.2,
  ease: [0.32, 0, 0.67, 0] as [number, number, number, number],
};

/**
 * 오버레이 배경 페이드인 트랜지션
 */
export const modalOverlayTransition = {
  duration: 0.24,
  ease: 'easeOut' as const,
};

/**
 * CSS / Emotion 기반 모달 팝업 애니메이션 (반동 효과 포함)
 */
export const livelyModalEnter = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(18px);
  }
  68% {
    opacity: 1;
    transform: scale(1.02) translateY(-2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

/**
 * CSS / Emotion 기반 바텀시트 슬라이드업 애니메이션 (상단 반동 효과 포함)
 */
export const livelyBottomSheetEnter = keyframes`
  0% {
    opacity: 0.4;
    transform: translateY(100%);
  }
  72% {
    opacity: 1;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;
