'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { MapMode } from '@/map/types';

// ============================================================
// 🇰🇷 한국 전통 현대화 2중·3중 컬러 토큰 기반 프리미엄 카테고리 아이콘
// (lightPalette: 단청 주홍, 대청 청록, 황금 기와, 연지 장미, 청화 코발트)
// ============================================================

/** 1. 고택·명소: 기와 지붕(청화 코발트) + 목조 기둥·마루(황금 기와) + 석조 기단(단청 주홍) 3중 컬러 */
function HanokSpotIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 1단계: 기와 처마 지붕 (청화 코발트 500 & 700) */}
      <path d="M12 2.5L21.5 8C20 8.5 17.5 9 12 9C6.5 9 4 8.5 2.5 8L12 2.5Z" fill={lightPalette.kobalt[500]} />
      <path d="M12 2.5L22 8L20 9.5C16 9 13.5 9 12 9C10.5 9 8 9 4 9.5L2 8L12 2.5Z" stroke={lightPalette.kobalt[700]} strokeWidth="0.5" />
      {/* 2단계: 목조 대들보 및 기둥 (황금 기와 500 & 700) */}
      <rect x="4.5" y="9.5" width="15" height="1.8" rx="0.5" fill={lightPalette.hwanggeum[700]} />
      <rect x="5.5" y="11.3" width="2" height="6.7" rx="0.4" fill={lightPalette.hwanggeum[500]} />
      <rect x="11" y="11.3" width="2" height="6.7" rx="0.4" fill={lightPalette.hwanggeum[500]} />
      <rect x="16.5" y="11.3" width="2" height="6.7" rx="0.4" fill={lightPalette.hwanggeum[500]} />
      {/* 격자 문살 창호 (연지 장미 & 백색 포인트) */}
      <rect x="8" y="12" width="2.5" height="5" rx="0.3" fill={lightPalette.cheongrok[100]} stroke={lightPalette.cheongrok[700]} strokeWidth="0.6" />
      <rect x="13.5" y="12" width="2.5" height="5" rx="0.3" fill={lightPalette.cheongrok[100]} stroke={lightPalette.cheongrok[700]} strokeWidth="0.6" />
      {/* 3단계: 석조 기단 및 디딤돌 (단청 주홍 500 & 700) */}
      <rect x="3" y="18" width="18" height="2.5" rx="0.8" fill={lightPalette.juhong[500]} />
      <rect x="2" y="20.5" width="20" height="1.5" rx="0.5" fill={lightPalette.juhong[700]} />
    </svg>
  );
}

/** 2. 한복·전통체험: 연지 장미(치마) + 청화 코발트(저고리) + 황금 기와(옷고름·노리개) 3중 컬러 */
function HanbokExperienceIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 한복 저고리 (청화 코발트 500 & 동정 백색) */}
      <path d="M7 4L12 7.5L17 4L20 8L17 10L15 8.5V11H9V8.5L7 10L4 8L7 4Z" fill={lightPalette.kobalt[500]} />
      <path d="M10.5 6.5L12 7.5L13.5 6.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      {/* 전통 옷고름 (황금 기와 500) */}
      <path d="M12 8V14L13.5 13.5" stroke={lightPalette.hwanggeum[500]} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="8.2" r="1" fill={lightPalette.hwanggeum[700]} />
      {/* 나풀거리는 풍성한 한복 치마 (연지 장미 500 & 음영 700) */}
      <path d="M9 11C9 11 7 14 5 21C8 22 16 22 19 21C17 14 15 11 15 11H9Z" fill={lightPalette.jangmi[500]} />
      <path d="M12 11C11.5 14 11 17.5 10 21.5" stroke={lightPalette.jangmi[700]} strokeWidth="0.8" opacity="0.6" />
      <path d="M13.5 11C13.8 14 14.5 17.5 15.5 21.5" stroke={lightPalette.jangmi[700]} strokeWidth="0.8" opacity="0.6" />
      {/* 반짝이는 전통 금박 별빛 포인트 (황금 기와 400) */}
      <circle cx="19.5" cy="5.5" r="1.5" fill={lightPalette.hwanggeum[400]} />
      <circle cx="4.5" cy="18.5" r="1.2" fill={lightPalette.cheongrok[400]} />
    </svg>
  );
}

/** 3. 문화재·서원: 서책 표지(청화 코발트) + 책장(황금 기와) + 붉은 서책 끈·책갈피(연지 장미) 3중 컬러 */
function SeowonCultureIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 서책 표지 본체 (청화 코발트 500 & 700) */}
      <path d="M3 5.5C3 4.4 3.9 3.5 5 3.5H11V19.5H5C3.9 19.5 3 18.6 3 17.5V5.5Z" fill={lightPalette.kobalt[500]} />
      <path d="M21 5.5C21 4.4 20.1 3.5 19 3.5H13V19.5H19C20.1 19.5 21 18.6 21 17.5V5.5Z" fill={lightPalette.kobalt[700]} />
      {/* 전통 오침안정법 한지 내지 (황금 기와 100 & 200) */}
      <path d="M4.5 5C4.5 4.5 5 4 5.5 4H11V18.5H5.5C5 18.5 4.5 18 4.5 17.5V5Z" fill={lightPalette.hwanggeum[100]} />
      <path d="M19.5 5C19.5 4.5 19 4 18.5 4H13V18.5H18.5C19 18.5 19.5 18 19.5 17.5V5Z" fill={lightPalette.hwanggeum[200]} />
      {/* 조선 서책 제본 붉은 명주실 (연지 장미 500 & 주홍) */}
      <circle cx="4" cy="6.5" r="0.8" fill={lightPalette.jangmi[500]} />
      <circle cx="4" cy="9.5" r="0.8" fill={lightPalette.jangmi[500]} />
      <circle cx="4" cy="13.5" r="0.8" fill={lightPalette.jangmi[500]} />
      <circle cx="4" cy="16.5" r="0.8" fill={lightPalette.jangmi[500]} />
      <path d="M12 3V21L14.5 19L17 21V16" fill={lightPalette.juhong[500]} />
    </svg>
  );
}

/** 4. 한옥숙소: 단청 주홍(기와 박공) + 대청 청록(창호 문살) + 황금 기와(따스한 온돌 마루) 3중 컬러 */
function HanokStayIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 한옥 팔작지붕 처마 (단청 주홍 500 & 700) */}
      <path d="M12 3L2 9.5L3.5 11L12 5.5L20.5 11L22 9.5L12 3Z" fill={lightPalette.juhong[700]} />
      <path d="M12 4.5L5 9.5H19L12 4.5Z" fill={lightPalette.juhong[500]} />
      {/* 전통 목조 기둥 및 벽체 (황금 기와 50) */}
      <rect x="5" y="9.5" width="14" height="10" fill={lightPalette.hwanggeum[50]} />
      <rect x="4.5" y="9.5" width="1.5" height="10.5" fill={lightPalette.hwanggeum[700]} />
      <rect x="18" y="9.5" width="1.5" height="10.5" fill={lightPalette.hwanggeum[700]} />
      {/* 청록빛 전통 격자 꽃살문 창호 (대청 청록 500 & 100) */}
      <rect x="8.5" y="11.5" width="7" height="8" rx="0.5" fill={lightPalette.cheongrok[50]} stroke={lightPalette.cheongrok[500]} strokeWidth="1" />
      <line x1="12" y1="11.5" x2="12" y2="19.5" stroke={lightPalette.cheongrok[500]} strokeWidth="0.8" />
      <line x1="8.5" y1="15.5" x2="15.5" y2="15.5" stroke={lightPalette.cheongrok[500]} strokeWidth="0.8" />
      {/* 툇마루 및 기단 (황금 기와 500 & 먹빛) */}
      <rect x="3" y="20" width="18" height="2" rx="0.5" fill={lightPalette.hwanggeum[500]} />
    </svg>
  );
}

/** 5. 향토음식: 뚝배기(먹빛 900) + 모락모락 온기 김(청화 코발트) + 맛깔스러운 고명(주홍, 황금, 청록) 3중 컬러 */
function TraditionalFoodIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 따스하게 피어오르는 온기 수증기 (청화 코발트 400 & 대청 청록) */}
      <path d="M8 3.5C7.5 5 8.5 6 7.5 7.5" stroke={lightPalette.kobalt[400]} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 2C11.5 4 12.5 5 11.5 6.5" stroke={lightPalette.cheongrok[400]} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 3.5C15.5 5 16.5 6 15.5 7.5" stroke={lightPalette.juhong[400]} strokeWidth="1.2" strokeLinecap="round" />
      {/* 전통 숨쉬는 옹기 뚝배기 몸통 (먹빛 900 & 황금 테두리) */}
      <ellipse cx="12" cy="11.5" rx="8.5" ry="2.5" fill="#3E2723" />
      <path d="M3.5 11.5C3.5 17 6.5 21 12 21C17.5 21 20.5 17 20.5 11.5H3.5Z" fill="#241B18" />
      {/* 맛깔스러운 보글보글 찌개 국물 (단청 주홍 500) */}
      <ellipse cx="12" cy="11.5" rx="7.2" ry="1.8" fill={lightPalette.juhong[500]} />
      {/* 정갈한 삼색 전통 고명 (초록 대파, 노란 계란지단, 붉은 고추) */}
      <circle cx="10" cy="11.5" r="1.3" fill={lightPalette.cheongrok[500]} />
      <circle cx="14" cy="11.5" r="1.3" fill={lightPalette.hwanggeum[400]} />
      <circle cx="12" cy="12" r="1.2" fill={lightPalette.jangmi[500]} />
      {/* 뚝배기 든든한 받침대 (황금 기와 700) */}
      <rect x="7" y="21" width="10" height="1.5" rx="0.5" fill={lightPalette.hwanggeum[700]} />
    </svg>
  );
}

/** 6. 한옥카페·디저트: 에메랄드 다도 찻잔(대청 청록) + 따스한 차(황금 기와) + 향기 꽃잎(연지 장미) 3중 컬러 */
function HanokCafeIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 그윽한 전통 찻방 다도 향기 (연지 장미 & 대청 청록) */}
      <path d="M8.5 3C8 4.5 9 5.5 8.5 7" stroke={lightPalette.cheongrok[400]} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 2.5C11.5 4 12.5 5 12 6.5" stroke={lightPalette.jangmi[400]} strokeWidth="1.2" strokeLinecap="round" />
      {/* 단아한 고려청자빛 찻잔 바디 (대청 청록 500 & 700) */}
      <path d="M4 8H17V14C17 17.5 14 19 10.5 19C7 19 4 17.5 4 14V8Z" fill={lightPalette.cheongrok[500]} />
      <path d="M17 9.5H19C20.1 9.5 21 10.4 21 11.5C21 12.6 20.1 13.5 19 13.5H17" stroke={lightPalette.cheongrok[700]} strokeWidth="1.8" strokeLinecap="round" />
      {/* 맑고 그윽한 황금빛 전통 매실·유자차 수면 (황금 기와 400 & 500) */}
      <ellipse cx="10.5" cy="8.2" rx="5.8" ry="1.4" fill={lightPalette.hwanggeum[400]} />
      {/* 차 위에 띄운 전통 대추·국화 꽃잎 (연지 장미 500) */}
      <circle cx="11" cy="8.2" r="1" fill={lightPalette.jangmi[500]} />
      {/* 우아한 목재 잔받침대 (황금 기와 700) */}
      <path d="M3 19.5C3 19.5 6 21.5 11 21.5C16 21.5 19 19.5 19 19.5" stroke={lightPalette.hwanggeum[700]} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 7. 전통시장: 알록달록 전통 처마 천막(단청 주홍 & 대청 청록 & 황금 기와 3색 스트라이프) + 정겨운 상점 */
function TraditionalMarketIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 알록달록 3색 전통 오일장 천막 어닝 (주홍 500, 황금 500, 청록 500) */}
      <path d="M3 8L4.5 4H7.5L6.5 8H3Z" fill={lightPalette.juhong[500]} />
      <path d="M6.5 8L7.5 4H10.5L9.5 8H6.5Z" fill={lightPalette.hwanggeum[500]} />
      <path d="M9.5 8L10.5 4H13.5L12.5 8H9.5Z" fill={lightPalette.cheongrok[500]} />
      <path d="M12.5 8L13.5 4H16.5L15.5 8H12.5Z" fill={lightPalette.kobalt[500]} />
      <path d="M15.5 8L16.5 4H19.5L18.5 8H15.5Z" fill={lightPalette.jangmi[500]} />
      <path d="M18.5 8L19.5 4H21L20.5 8H18.5Z" fill={lightPalette.juhong[500]} />
      {/* 어닝 처마 곡선 물결 (황금 기와 700) */}
      <path d="M2.5 8C3.5 9.5 5.5 9.5 6.5 8C7.5 9.5 9.5 9.5 10.5 8C11.5 9.5 13.5 9.5 14.5 8C15.5 9.5 17.5 9.5 18.5 8C19.5 9.5 21 9 21.5 8" stroke={lightPalette.hwanggeum[700]} strokeWidth="1.2" strokeLinecap="round" />
      {/* 상점 기둥 및 진열대 매대 (황금 기와 200 & 단청 주홍 매대) */}
      <rect x="4" y="9.5" width="1.5" height="10" fill={lightPalette.hwanggeum[500]} />
      <rect x="18.5" y="9.5" width="1.5" height="10" fill={lightPalette.hwanggeum[500]} />
      <rect x="5.5" y="13" width="13" height="7" rx="0.5" fill={lightPalette.juhong[50]} stroke={lightPalette.juhong[500]} strokeWidth="1" />
      {/* 장터 풍성한 청과·특산물 바구니 (청록, 황금, 장미 3색) */}
      <circle cx="8.5" cy="15.5" r="1.5" fill={lightPalette.jangmi[500]} />
      <circle cx="12" cy="15.5" r="1.5" fill={lightPalette.cheongrok[500]} />
      <circle cx="15.5" cy="15.5" r="1.5" fill={lightPalette.hwanggeum[500]} />
      {/* 장터 바닥 (먹빛 400) */}
      <line x1="2" y1="20.5" x2="22" y2="20.5" stroke={meok[400]} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 8. 온기 불꽃: 단청 주홍(외측 불꽃) + 황금 기와(중간 온기) + 레몬 옐로우(중심 코어) 3중 컬러 */
function WarmthFlameIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 1층: 외측 큰 불꽃 (단청 주홍 500) */}
      <path d="M12 2C12 2 15 6.5 15 9.5C15 11 14 12 13 12.5C14.8 12.8 17.5 14 18.5 16C20 18.5 19 21.5 16.5 22.5C14 23.5 10 23.5 7.5 22.5C5 21.5 4 18.5 5.5 16C6.5 14 9.2 12.8 11 12.5C10 12 9 11 9 9.5C9 6.5 12 2 12 2Z" fill={lightPalette.juhong[500]} />
      {/* 2층: 중간 온기 불꽃 (황금 기와 500) */}
      <path d="M12 7.5C12 7.5 14 10.5 14 12.5C14 13.5 13.5 14.2 12.8 14.5C14 14.8 15.5 15.5 16 17C16.8 18.8 16 20.8 14.5 21.5C13 22.2 11 22.2 9.5 21.5C8 20.8 7.2 18.8 8 17C8.5 15.5 10 14.8 11.2 14.5C10.5 14.2 10 13.5 10 12.5C10 10.5 12 7.5 12 7.5Z" fill={lightPalette.hwanggeum[500]} />
      {/* 3층: 중심 코어 불꽃 (황금 기와 100 백색광) */}
      <path d="M12 13.5C12 13.5 13 15 13 16.2C13 17.5 12 18.5 12 20C12 18.5 11 17.5 11 16.2C11 15 12 13.5 12 13.5Z" fill="#FFFBE6" />
    </svg>
  );
}

/** 온기W1. 북적이는 곳: 연지 장미(사람들) + 황금 기와(따스한 빛) + 대청 청록(생동감 포인트) 3중 컬러 */
function BusyPlaceIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 중앙 인물 (연지 장미 500) */}
      <circle cx="12" cy="6" r="3" fill={lightPalette.jangmi[500]} />
      <path d="M6 20C6 16.5 8.7 14 12 14C15.3 14 18 16.5 18 20" stroke={lightPalette.jangmi[500]} strokeWidth="2" strokeLinecap="round" />
      {/* 왼쪽 인물 (황금 기와 500) */}
      <circle cx="5.5" cy="7.5" r="2.2" fill={lightPalette.hwanggeum[500]} />
      <path d="M1 20C1 17.5 3 15.5 5.5 15.5C6.5 15.5 7.5 15.9 8.3 16.5" stroke={lightPalette.hwanggeum[500]} strokeWidth="1.6" strokeLinecap="round" />
      {/* 오른쪽 인물 (대청 청록 500) */}
      <circle cx="18.5" cy="7.5" r="2.2" fill={lightPalette.cheongrok[500]} />
      <path d="M23 20C23 17.5 21 15.5 18.5 15.5C17.5 15.5 16.5 15.9 15.7 16.5" stroke={lightPalette.cheongrok[500]} strokeWidth="1.6" strokeLinecap="round" />
      {/* 따스한 활기 파장 (황금 기와 400) */}
      <path d="M10 2.5C10.6 2.2 11.3 2 12 2C12.7 2 13.4 2.2 14 2.5" stroke={lightPalette.hwanggeum[400]} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 온기W2. 한적한 곳: 청화 코발트(달·별) + 대청 청록(밤 풍경 산) + 황금 기와(초승달 빛) 3중 컬러 */
function QuietPlaceIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 밤 하늘 산 실루엣 (대청 청록 700) */}
      <path d="M2 20L7 10L11 16L15 8L22 20H2Z" fill={lightPalette.cheongrok[700]} opacity="0.85" />
      {/* 그 위 여린 청록 연무 (대청 청록 200) */}
      <path d="M2 20L8 13L12 17L16 11L22 20H2Z" fill={lightPalette.cheongrok[200]} opacity="0.5" />
      {/* 초승달 (황금 기와 500) */}
      <path d="M18 3C19.5 4.5 19.5 7 18 8.5C17 9.5 15.7 9.7 14.5 9.2C15 8.5 15.2 7.5 15 6.5C14.8 5.5 14.2 4.7 13.5 4.2C14.7 3.5 16.5 2.5 18 3Z" fill={lightPalette.hwanggeum[500]} />
      {/* 별빛 (청화 코발트 500) */}
      <circle cx="5" cy="5" r="1" fill={lightPalette.kobalt[400]} />
      <circle cx="9" cy="3" r="0.7" fill={lightPalette.kobalt[500]} />
      <circle cx="20.5" cy="6" r="0.8" fill={lightPalette.kobalt[400]} />
    </svg>
  );
}

/** 온기W3. 오늘의 온기: 황금 기와(달력 몸체) + 단청 주홍(날짜 강조) + 대청 청록(오늘 표시) 3중 컬러 */
function TodayWarmthIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 달력 본체 (황금 기와 100 배경 + 700 테두리) */}
      <rect x="2.5" y="4" width="19" height="17" rx="3" fill={lightPalette.hwanggeum[100]} stroke={lightPalette.hwanggeum[700]} strokeWidth="1.4" />
      {/* 달력 상단 헤더 바 (단청 주홍 500) */}
      <rect x="2.5" y="4" width="19" height="5.5" rx="3" fill={lightPalette.juhong[500]} />
      <rect x="2.5" y="7" width="19" height="2.5" fill={lightPalette.juhong[500]} />
      {/* 달력 핀 고리 (황금 기와 700) */}
      <rect x="8" y="2" width="2" height="4" rx="1" fill={lightPalette.hwanggeum[700]} />
      <rect x="14" y="2" width="2" height="4" rx="1" fill={lightPalette.hwanggeum[700]} />
      {/* 오늘 날짜 하이라이트 (대청 청록 500 원형) */}
      <circle cx="12" cy="16" r="3.5" fill={lightPalette.cheongrok[500]} />
      <text x="12" y="20" textAnchor="middle" fontSize="5" fontWeight="700" fill="white" dominantBaseline="auto">오늘</text>
      {/* 주변 날짜 점 (황금 기와 400) */}
      <circle cx="6.5" cy="15" r="1" fill={lightPalette.hwanggeum[400]} />
      <circle cx="17.5" cy="15" r="1" fill={lightPalette.hwanggeum[400]} />
    </svg>
  );
}

/** 온기W4. 내 온기: 대청 청록(심장 박동 파형) + 연지 장미(하트) + 황금 기와(빛 포인트) 3중 컬러 */
function MyWarmthIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
      {/* 연지 장미 하트 (jangmi 500 + 700 음영) */}
      <path d="M12 20C12 20 3 14 3 8.5C3 5.9 5 4 7.5 4C9.2 4 10.7 5 11.5 6.3C11.7 5.8 12 5.4 12 5.4C12 5.4 12.3 5.8 12.5 6.3C13.3 5 14.8 4 16.5 4C19 4 21 5.9 21 8.5C21 14 12 20 12 20Z" fill={lightPalette.jangmi[500]} />
      <path d="M12 20C12 20 3 14 3 8.5C3 5.9 5 4 7.5 4" stroke={lightPalette.jangmi[700]} strokeWidth="0.5" opacity="0.4" />
      {/* 하트 위 황금 빛 하이라이트 (황금 기와 400) */}
      <ellipse cx="9" cy="8" rx="2.5" ry="1.5" fill={lightPalette.hwanggeum[400]} opacity="0.55" transform="rotate(-30 9 8)" />
      {/* 대청 청록 심장 박동 파형 (cheongrok 500) */}
      <path d="M3 13H6.5L8 10.5L10 15.5L12 11L14 14L15.5 12.5H21" stroke={lightPalette.cheongrok[500]} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

interface CategoryItem {
  id: string;
  label: string;
  keyword: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
}

const CATEGORIES: Record<MapMode, CategoryItem[]> = {
  info: [
    { id: 'spot', label: '고택·명소', keyword: '고택', icon: HanokSpotIcon },
    { id: 'culture', label: '문화재·서원', keyword: '서원', icon: SeowonCultureIcon },
    { id: 'stay', label: '한옥숙소', keyword: '한옥스테이', icon: HanokStayIcon },
    { id: 'food', label: '향토음식', keyword: '향토음식', icon: TraditionalFoodIcon },
    { id: 'cafe', label: '한옥카페·디저트', keyword: '한옥카페', icon: HanokCafeIcon },
    { id: 'market', label: '전통시장', keyword: '전통시장', icon: TraditionalMarketIcon },
  ],
  warmth: [
    { id: 'all', label: '모든 온기', keyword: '', icon: WarmthFlameIcon },
    { id: 'busy', label: '북적이는 곳', keyword: '북적', icon: BusyPlaceIcon },
    { id: 'quiet', label: '한적한 곳', keyword: '한적', icon: QuietPlaceIcon },
    { id: 'today', label: '오늘의 온기', keyword: '오늘', icon: TodayWarmthIcon },
    { id: 'mine', label: '내 온기', keyword: '내온기', icon: MyWarmthIcon },
  ],
};

const chipPopIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.88);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Scroller = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Chip = styled.button<{ $index: number }>`
  display: flex;
  flex: none;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 16px;

  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(25, 31, 40, 0.06);

  color: ${meok[700]};
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  /* stagger pop-in: 마운트 시 순차 등장 */
  opacity: 0;
  animation: ${chipPopIn} 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: ${({ $index }) => $index * 55}ms;

  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.2s ease,
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${surface.light.card};
    color: ${meok[900]};
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    border-color: rgba(25, 31, 40, 0.12);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

export default function CategoryChips() {
  const mode = useMapStore((s) => s.mode);
  const setCategory = useMapStore((s) => s.setCategory);
  const triggerSearch = useMapStore((s) => s.triggerSearch);

  const handleChipClick = (item: CategoryItem) => {
    // 1. 온기 모드에서는 카테고리 필터 변경
    if (mode === 'warmth') {
      setCategory(item.id === 'all' ? null : item.id);
      return;
    }

    // 2. 정보 모드에서는 카테고리 필터 설정과 함께 좌측 검색창에 해당 문구 작성 & 검색 실행
    setCategory(item.id);
    triggerSearch(item.keyword || item.label);
  };

  return (
    <Scroller role="group" aria-label="카테고리 필터">
      {CATEGORIES[mode].map((item, index) => {
        const Icon = item.icon;
        return (
          <Chip
            key={item.id}
            type="button"
            $index={index}
            onClick={() => handleChipClick(item)}
          >
            <Icon size={18} aria-hidden />
            <span>{item.label}</span>
          </Chip>
        );
      })}
    </Scroller>
  );
}
