'use client';

import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { motion, useReducedMotion } from 'framer-motion';
import {
  IoBookOutline,
  IoLocationOutline,
  IoFlame,
  IoHeadsetOutline,
  IoBookmarkOutline,
  IoHomeOutline,
  IoPersonOutline,
} from 'react-icons/io5';
import { transientProps } from '@/design-system/styled';
import { useMapStore } from '@/map/hooks/useMapStore';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { RAIL_ENTER_DELAY_S, RAIL_ENTER_DURATION_S, ENTRANCE_EASE } from '@/shared/navigation/mapEntranceTiming';

export const RAIL_WIDTH = 60;
export const RAIL_INSET = 14;

/** Header.tsx의 캡슐형 GNB와 같은 유리질감(블러+반투명+가느다란 보더)을 쓰는
 *  얇고 떠 있는 세로 레일 — 예전의 68px 꽉찬 화이트 사이드바 대신, 뷰포트에서
 *  14px 띄운 캡슐로 /hanok·/odii의 상단 GNB와 톤을 맞춘다. */
const RailContainer = styled(motion.aside, transientProps)`
  position: absolute;
  top: ${RAIL_INSET}px;
  bottom: ${RAIL_INSET}px;
  left: ${RAIL_INSET}px;
  width: ${RAIL_WIDTH}px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  gap: 2px;
  border-radius: 22px;
  user-select: none;

  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 12px 32px -8px rgba(0, 0, 0, 0.1),
    0 4px 12px -4px rgba(0, 0, 0, 0.04);

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** 상단 온마루 브랜드 로고 영역 */
const LogoArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.06);
  }
`;

const BrandIconBadge = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, ${lightPalette.cheongrok[500]} 0%, ${lightPalette.cheongrok[700]} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${surface.light.card};
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.5px;
  box-shadow: 0 2px 6px rgba(0, 184, 130, 0.28);
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 2px;
  flex: 1;
`;

/** 아이콘 전용 슬림 네비게이션 버튼 — 라벨은 title 툴팁으로 대체해 폭을 줄인다. */
const NavItemBtn = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  outline: none;
  border-radius: 12px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? lightPalette.cheongrok[50] : 'transparent')};
  color: ${({ $active }) => ($active ? lightPalette.cheongrok[700] : meok[500])};
  transition:
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.cheongrok[50] : 'rgba(0, 0, 0, 0.045)')};
    color: ${({ $active }) => ($active ? lightPalette.cheongrok[700] : meok[900])};
  }

  &:active {
    transform: scale(0.92);
  }
`;

const NavItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BottomArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 2px;
  padding-bottom: 2px;
`;

const Divider = styled.div`
  width: 24px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 6px 0;
`;

export default function MapNavRail() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  const setCategory = useMapStore((s) => s.setCategory);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const setPanelOpen = useMapStore((s) => s.setPanelOpen);

  const handleSelectInfoMap = () => {
    setMode('info');
    setCategory(null);
    if (!panelOpen) setPanelOpen(true);
  };

  const handleSelectWarmthMap = () => {
    setMode('warmth');
    if (!panelOpen) setPanelOpen(true);
  };

  // 온마루 자체 카테고리 활성 판별
  const isMapActive = true; // 현재 /map 페이지
  const isWarmthActive = mode === 'warmth';

  return (
    <RailContainer
      role="navigation"
      aria-label="온마루 메인 카테고리 네비게이션"
      initial={prefersReducedMotion ? false : { x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: RAIL_ENTER_DURATION_S, delay: RAIL_ENTER_DELAY_S, ease: ENTRANCE_EASE }
      }
    >
      {/* 1. 상단 온마루 브랜드 로고 */}
      <LogoArea onClick={() => router.push('/')} title="온마루 메인 홈으로 이동">
        <BrandIconBadge>온</BrandIconBadge>
      </LogoArea>

      {/* 2. 온마루 자체 카테고리 목록 (한옥도감, 지도, 소리마루, 온기이야기, 저장) — 라벨은 title 툴팁으로 대체 */}
      <NavList>
        {/* 온마루 카테고리 1: 한옥도감 */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/hanok')}
          aria-label="한옥도감"
          title="한옥도감"
        >
          <NavItemIcon>
            <IoBookOutline size={19} />
          </NavItemIcon>
        </NavItemBtn>

        {/* 온마루 카테고리 2: 지도 (정보지도) — 온기지도 전환은 아래 '온기이야기' 항목과 패널 내 ModeToggle이 담당한다 */}
        <NavItemBtn
          type="button"
          $active={isMapActive}
          onClick={handleSelectInfoMap}
          aria-label="정보지도"
          title="정보지도"
        >
          <NavItemIcon>
            <IoLocationOutline size={19} />
          </NavItemIcon>
        </NavItemBtn>

        {/* 온마루 카테고리 3: 소리마루 (오디 도슨트) */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/odii')}
          aria-label="소리마루"
          title="소리마루"
        >
          <NavItemIcon>
            <IoHeadsetOutline size={19} />
          </NavItemIcon>
        </NavItemBtn>

        {/* 온마루 카테고리 4: 온기이야기 (지도 내 온기 후기 & 온도 모드 바로가기) */}
        <NavItemBtn
          type="button"
          $active={isWarmthActive}
          onClick={handleSelectWarmthMap}
          aria-label="온기이야기"
          title="온기이야기"
        >
          <NavItemIcon>
            <IoFlame size={19} />
          </NavItemIcon>
        </NavItemBtn>

        {/* 온마루 카테고리 5: 저장한 장소 */}
        <NavItemBtn
          type="button"
          $active={mode === 'info' && useMapStore.getState().category === 'bookmark'}
          onClick={() => {
            setMode('info');
            setCategory('bookmark');
            if (!panelOpen) setPanelOpen(true);
          }}
          aria-label="마음에 담은 장소"
          title="마음에 담은 장소"
        >
          <NavItemIcon>
            <IoBookmarkOutline size={19} />
          </NavItemIcon>
        </NavItemBtn>
      </NavList>

      {/* 3. 하단 유틸리티 메뉴 (온마루 홈, 마이/로그인) */}
      <BottomArea>
        <Divider />
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/')}
          aria-label="온마루 3D 홈으로 이동"
          title="온마루 홈"
        >
          <NavItemIcon>
            <IoHomeOutline size={19} />
          </NavItemIcon>
        </NavItemBtn>

        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/auth/login')}
          aria-label="마이 / 로그인"
          title="로그인"
        >
          <NavItemIcon>
            <IoPersonOutline size={19} />
          </NavItemIcon>
        </NavItemBtn>
      </BottomArea>
    </RailContainer>
  );
}
