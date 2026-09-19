'use client';

import { useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { surface } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import PlaceDetail from './PlaceDetail';
import PopularPlacesPanel from './warmth/PopularPlacesPanel';

const PANEL_WIDTH = 380;
const PANEL_WIDTH_COMPACT = 360;

/*
  너비는 그대로 CSS 미디어쿼리로 연다/닫는다 — 반응형 분기점이 뷰포트 폭에
  달려 있어서, JS(useState/useEffect)로 옮기면 SSR에는 없는 window.innerWidth를
  읽어야 해 hydration 시점에 서버/클라이언트 값이 어긋날 수 있다. Framer Motion은
  그 값과 무관한 opacity/x(transform)만 맡아서 진입 곡선만 스프링으로 매만진다.
*/
const DetailAside = styled(motion.aside)<{ $open: boolean }>`
  position: relative;
  flex: none;
  width: ${({ $open }) => ($open ? `${PANEL_WIDTH}px` : '0px')};
  height: 100%;
  background: ${surface.light.card};
  border-radius: 24px;

  z-index: 22;
  pointer-events: auto;
  overflow: hidden;
  transition: width 0.32s cubic-bezier(0.32, 0.72, 0, 1);

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6), 0 4px 12px -4px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 1024px) and (max-width: 1439px) {
    width: ${({ $open }) => ($open ? `${PANEL_WIDTH_COMPACT}px` : '0px')};
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;

const Inner = styled.div`
  width: ${PANEL_WIDTH}px;
  height: 100%;
  overflow: hidden;

  @media (min-width: 1024px) and (max-width: 1439px) {
    width: ${PANEL_WIDTH_COMPACT}px;
  }
`;

const ContentSwap = styled(motion.div)`
  width: 100%;
  height: 100%;
`;

export default function DetailPanel() {
  const map = useMapStore((s) => s.map);
  const detailId = useMapStore((s) => s.detailId);
  const popularPanelOpen = useMapStore((s) => s.popularPanelOpen);
  const prefersReducedMotion = useReducedMotion();

  const isOpen = Boolean(detailId) || popularPanelOpen;

  // 패널이 열리거나 닫힌 후 카카오맵 뷰포트 relayout 재계산
  useEffect(() => {
    const timer = setTimeout(() => {
      if (map && window.kakao?.maps) {
        map.relayout();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, map]);

  const contentKey = popularPanelOpen ? 'popular' : detailId || 'empty';

  return (
    <DetailAside
      $open={isOpen}
      aria-hidden={!isOpen}
      initial={false}
      animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -16 }}
      transition={
        prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 36 }
      }
    >
      <Inner>
        <AnimatePresence mode="wait" initial={false}>
          <ContentSwap
            key={contentKey}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {popularPanelOpen ? (
              <PopularPlacesPanel />
            ) : detailId ? (
              <PlaceDetail />
            ) : null}
          </ContentSwap>
        </AnimatePresence>
      </Inner>
    </DetailAside>
  );
}
