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

const RAIL_WIDTH = 68;

const RailContainer = styled(motion.aside, transientProps)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: ${RAIL_WIDTH}px;
  background: ${surface.light.card};
  border-right: 1px solid ${meok[200]};
  z-index: 25;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  box-shadow: 1px 0 8px rgba(0, 0, 0, 0.04);

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
  height: 64px;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.06);
  }
`;

const BrandIconBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${lightPalette.cheongrok[500]} 0%, ${lightPalette.cheongrok[700]} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${surface.light.card};
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.5px;
  box-shadow: 0 2px 8px rgba(0, 184, 130, 0.32);
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

/** 온마루 내비게이션 아이템 버튼 (온마루 대청 청록 액센트) */
const NavItemBtn = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 66px;
  padding: 0;
  border: none;
  outline: none;
  cursor: pointer;
  background: ${({ $active }) => ($active ? lightPalette.cheongrok[500] : 'transparent')};
  color: ${({ $active }) => ($active ? surface.light.card : meok[700])};
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.cheongrok[500] : meok[100])};
    color: ${({ $active }) => ($active ? surface.light.card : meok[900])};
  }

  &:active {
    transform: scale(0.96);
  }
`;

const NavItemIcon = styled.div<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  color: ${({ $active }) => ($active ? surface.light.card : meok[700])};
`;

const NavItemLabel = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 11.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  letter-spacing: -0.3px;
  line-height: 1.2;
  white-space: nowrap;
`;

const BottomArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-bottom: 14px;
`;

const Divider = styled.div`
  width: 44px;
  height: 1px;
  background: ${meok[200]};
  margin: 8px 0;
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

      {/* 2. 온마루 자체 카테고리 목록 (한옥도감, 지도 ⌵, 소리마루, 온기이야기, 저장) */}
      <NavList>
        {/* 온마루 카테고리 1: 한옥도감 */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/hanok')}
          aria-label="한옥도감"
          title="디지털 한옥도감 & 문화유산 아카이브"
        >
          <NavItemIcon $active={false}>
            <IoBookOutline size={22} />
          </NavItemIcon>
          <NavItemLabel $active={false}>한옥도감</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 2: 지도 (정보지도) — 온기지도 전환은 아래 '온기이야기' 항목과 패널 내 ModeToggle이 담당한다 */}
        <NavItemBtn
          type="button"
          $active={isMapActive}
          onClick={handleSelectInfoMap}
          aria-label="정보지도"
          title="온마루 정보지도"
        >
          <NavItemIcon $active={isMapActive}>
            <IoLocationOutline size={22} />
          </NavItemIcon>
          <NavItemLabel $active={isMapActive}>지도</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 3: 소리마루 (오디 도슨트) */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/odii')}
          aria-label="소리마루"
          title="공간 오디오 가이드 도슨트 소리마루"
        >
          <NavItemIcon $active={false}>
            <IoHeadsetOutline size={22} />
          </NavItemIcon>
          <NavItemLabel $active={false}>소리마루</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 4: 온기이야기 (지도 내 온기 후기 & 온도 모드 바로가기) */}
        <NavItemBtn
          type="button"
          $active={isWarmthActive}
          onClick={handleSelectWarmthMap}
          aria-label="온기이야기"
          title="실시간 여행자 온기 후기 및 훈기 레이어"
        >
          <NavItemIcon $active={isWarmthActive}>
            <IoFlame size={21} />
          </NavItemIcon>
          <NavItemLabel $active={isWarmthActive}>온기이야기</NavItemLabel>
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
          title="마음에 담은 장소 보관함"
        >
          <NavItemIcon $active={mode === 'info' && useMapStore.getState().category === 'bookmark'}>
            <IoBookmarkOutline size={21} />
          </NavItemIcon>
          <NavItemLabel $active={mode === 'info' && useMapStore.getState().category === 'bookmark'}>
            저장
          </NavItemLabel>
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
          title="온마루 인터랙티브 3D 한옥 메인 홈으로 이동"
        >
          <NavItemIcon $active={false}>
            <IoHomeOutline size={21} />
          </NavItemIcon>
          <NavItemLabel $active={false}>온마루 홈</NavItemLabel>
        </NavItemBtn>

        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/auth/login')}
          aria-label="마이 / 로그인"
          title="로그인 및 마이페이지"
        >
          <NavItemIcon $active={false}>
            <IoPersonOutline size={21} />
          </NavItemIcon>
          <NavItemLabel $active={false}>로그인</NavItemLabel>
        </NavItemBtn>
      </BottomArea>
    </RailContainer>
  );
}
