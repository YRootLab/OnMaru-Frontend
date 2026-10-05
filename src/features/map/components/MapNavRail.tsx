'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark01Icon, HeadphonesIcon, Home01Icon, MapPinIcon, SparklesIcon, UserIcon } from '@hugeicons/core-free-icons'
import { HanokIcon } from './HanokIcon'
import { transientProps } from '@/design-system/styled';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useJourneyStore } from '@/features/journey-curator/store/useJourneyStore';
import { lightPalette, meok, fontSize, ringShadow } from '@/design-system/tokens';
import { RAIL_ENTER_DELAY_S, RAIL_ENTER_DURATION_S, ENTRANCE_EASE } from '@/shared/navigation/mapEntranceTiming';
import { useMapEntranceStore } from '@/shared/navigation/mapEntranceState';

import { useAuth } from '@/features/auth';
import { OniAvatar } from '@/features/profile/OniAvatar';

export const RAIL_WIDTH = 68;
export const RAIL_INSET = 14;
const ONMARU_LOGO_SRC = '/logo.png';



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

  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: ${ringShadow.light.card};
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  [data-theme='dark'] & {
    background: rgba(11, 18, 32, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: ${ringShadow.dark.card};
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;


const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  padding: 4px 0 2px;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:focus-visible {
    outline: 2px solid var(--color-action-secondary);
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const LogoText = styled.span`
  font-family: var(--font-hanok);
  font-weight: 900;
  font-size: 11px;
  letter-spacing: -0.03em;
  color: ${meok[900]};
  line-height: 1;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const LogoDivider = styled.div`
  width: 28px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 4px 0 6px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 4px;
  flex: 1;
`;


const NavItemBtn = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 58px;
  padding: 6px 2px 5px;
  border: none;
  outline: none;
  border-radius: 12px;
  cursor: pointer;
  gap: 3px;
  background: ${({ $active }) => ($active ? 'rgba(0, 0, 0, 0.07)' : 'transparent')};
  color: ${({ $active }) => ($active ? meok[900] : meok[500])};
  transition:
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${({ $active }) => ($active ? 'rgba(0, 0, 0, 0.07)' : 'rgba(0, 0, 0, 0.045)')};
    color: ${({ $active }) => ($active ? meok[900] : meok[900])};
  }

  &:active {
    transform: scale(0.92);
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.10)' : 'transparent')};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};

    &:hover {
      background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.08)')};
      color: ${({ $active }) => ($active ? '#ffffff' : '#ffffff')};
    }
  }
`;

const NavItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavItemLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.03em;
  text-align: center;
  white-space: nowrap;
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

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.12);
  }
`;


export default function MapNavRail() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const setPanelOpen = useMapStore((s) => s.setPanelOpen);

  const resetJourney = useJourneyStore((s) => s.resetJourney);

  const handleGoHome = () => {
    resetJourney();
    router.push('/');
  };

  const handleSelectInfoMap = () => {
    setMode('info');
    setCategory(null);
    if (!panelOpen) setPanelOpen(true);
  };


  const isMapActive = mode === 'info' && category !== 'bookmark';
  const isRouteEntrance = useMapEntranceStore((s) => s.isRouteEntrance);

  return (
    <RailContainer
      role="navigation"
      aria-label="온마루 메인 카테고리 네비게이션"
      initial={isRouteEntrance ? { x: '-100%', opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      transition={
        isRouteEntrance
          ? { duration: RAIL_ENTER_DURATION_S, delay: RAIL_ENTER_DELAY_S, ease: ENTRANCE_EASE }
          : { duration: 0 }
      }
    >
      {}
      <LogoArea
        role="button"
        tabIndex={0}
        onClick={handleGoHome}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleGoHome();
          }
        }}
        aria-label="온마루 메인 홈으로 이동"
        title="온마루 메인 홈으로 이동"
      >
        <Image
          src={ONMARU_LOGO_SRC}
          alt="온마루 로고"
          width={28}
          height={28}
          style={{ objectFit: 'contain', borderRadius: '7px' }}
          priority
        />

      </LogoArea>

      <LogoDivider />

      {}
      <NavList>
        <NavItemBtn
          type="button"
          $active={false}
          onClick={handleGoHome}
          aria-label="홈으로 이동"
          title="홈"
        >
          <NavItemIcon>
            <HugeiconsIcon icon={Home01Icon} size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>홈</NavItemLabel>
        </NavItemBtn>

        {}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/hanok')}
          aria-label="한옥마루"
          title="한옥마루"
        >
          <NavItemIcon>
            <HanokIcon size={22} />
          </NavItemIcon>
          <NavItemLabel>한옥마루</NavItemLabel>
        </NavItemBtn>

        {}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/sorimaru')}
          aria-label="소리마루"
          title="소리마루"
        >
          <NavItemIcon>
            <HugeiconsIcon icon={HeadphonesIcon} size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>소리마루</NavItemLabel>
        </NavItemBtn>

        {}
        <NavItemBtn
          type="button"
          $active={isMapActive}
          onClick={handleSelectInfoMap}
          aria-label="지도마루"
          title="지도마루"
        >
          <NavItemIcon>
            <HugeiconsIcon icon={MapPinIcon} size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>지도마루</NavItemLabel>
        </NavItemBtn>

        {/* [TEMP] 도장첩 — 준비 중, 복원 시 주석 해제
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/stamps')}
          aria-label="한옥 도장첩"
          title="한옥 도장첩"
        >
          <NavItemIcon>
            <HugeiconsIcon icon={Award01Icon} size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>도장첩</NavItemLabel>
        </NavItemBtn>
        */}


        {}
        <NavItemBtn
          type="button"
          $active={mode === 'info' && category === 'bookmark'}
          onClick={() => {
            setMode('info');
            setCategory('bookmark');
            if (!panelOpen) setPanelOpen(true);
          }}
          aria-label="모음마루"
          title="모음마루"
        >
          <NavItemIcon>
            <HugeiconsIcon icon={Bookmark01Icon} size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>모음마루</NavItemLabel>
        </NavItemBtn>
      </NavList>

      {}
      <BottomArea>
        <Divider />
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push(isLoggedIn ? '/mypage' : '/auth/login')}
          aria-label={isLoggedIn ? '마이페이지' : '로그인'}
          title={isLoggedIn ? (user?.displayName ?? '마이페이지') : '로그인'}
        >
          <NavItemIcon>
            {isLoggedIn ? (
              <OniAvatar characterId={user?.characterId} backgroundId={user?.backgroundId} size={24} />
            ) : (
              <HugeiconsIcon icon={UserIcon} size={19} strokeWidth={2} />
            )}
          </NavItemIcon>
          <NavItemLabel>{isLoggedIn ? (user?.displayName || '마이') : '마이'}</NavItemLabel>
        </NavItemBtn>
      </BottomArea>
    </RailContainer>
  );
}
