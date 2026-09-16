'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Bookmark,
  Check,
  Headphones,
  MapPin,
  Moon,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { lightPalette, meok , fontSize } from '@/design-system/tokens';
import { RAIL_ENTER_DELAY_S, RAIL_ENTER_DURATION_S, ENTRANCE_EASE } from '@/shared/navigation/mapEntranceTiming';
import { useMapEntranceStore } from '@/shared/navigation/mapEntranceState';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import {
  getThemePreferenceLabel,
  getThemePreferenceSummary,
  getThemeTriggerLabel,
} from '@/design-system/themePreferenceLabels';
import type { ThemePreference } from '@/design-system/tokens';

export const RAIL_WIDTH = 68;
export const RAIL_INSET = 14;
const ONMARU_LOGO_LIGHT_SRC = '/images/logo/onmaru-logo-ivory.png';
const ONMARU_LOGO_DARK_SRC = '/images/logo/onmaru-logo-dark-charcoal.png';

/** Header.tsx의 캡슐형 GNB와 같은 유리질감(블러+반투명+가느다란 보더)을 쓰는
 *  얇고 떠 있는 세로 레일 — 다크 모드에서는 깊이감 있는 먹빛 플로팅 캡슐로 전환된다. */
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
  box-shadow:
    0 12px 32px -8px rgba(0, 0, 0, 0.1),
    0 4px 12px -4px rgba(0, 0, 0, 0.04);
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 12px 32px -8px rgba(0, 0, 0, 0.5),
      0 4px 12px -4px rgba(0, 0, 0, 0.3);
  }

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
    transform: scale(1.08);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.cheongrok[500]};
    outline-offset: 2px;
    border-radius: 8px;
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

/** 아이콘 + 한글 라벨 네비게이션 버튼 */
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

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? 'rgba(0, 168, 150, 0.25)' : 'transparent')};
    color: ${({ $active }) => ($active ? '#2dd4bf' : meok[400])};

    &:hover {
      background: ${({ $active }) => ($active ? 'rgba(0, 168, 150, 0.32)' : 'rgba(255, 255, 255, 0.08)')};
      color: ${({ $active }) => ($active ? '#2dd4bf' : '#ffffff')};
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

const ThemeRailItemWrap = styled.div`
  position: relative;
  width: 58px;
`;

const ThemeRailPopover = styled(motion.div)`
  position: absolute;
  left: calc(100% + 10px);
  bottom: 0;
  width: 214px;
  padding: 6px;
  border-radius: 16px;
  background: rgba(250, 250, 249, 0.94);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  z-index: 3;

  [data-theme='dark'] & {
    background: rgba(27, 25, 22, 0.94);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.36);
  }
`;

const ThemeRailChoiceButton = styled.button<{ $active: boolean }>`
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 12px;
  padding: 8px 9px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 8px;
  background: ${({ $active }) => ($active ? 'rgba(0, 0, 0, 0.055)' : 'transparent')};
  color: ${meok[900]};
  cursor: pointer;
  text-align: left;
  transition: background-color 160ms ease;

  &:hover {
    background: rgba(0, 0, 0, 0.045);
  }

  [data-theme='dark'] & {
    color: #ffffff;
    background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.12)' : 'transparent')};

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const ThemeRailChoiceIcon = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ThemeRailChoiceCopy = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ThemeRailChoiceTitle = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 700;
  line-height: 1.2;
`;

const ThemeRailChoiceSummary = styled.span`
  font-size: 11px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(87, 79, 68, 0.76);

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.66);
  }
`;

const ThemeRailChoiceCheck = styled.span`
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export default function MapNavRail() {
  const router = useRouter();
  const { preference, mode: themeMode, setMode: setThemeMode } = useOnmaruTheme();
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);
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

  // 온마루 자체 카테고리 활성 판별
  const isMapActive = true; // 현재 /map 페이지
  const isRouteEntrance = useMapEntranceStore((s) => s.isRouteEntrance);
  const themeOptions: ThemePreference[] = ['system', 'light', 'dark'];
  const ThemeTriggerIcon = themeMode === 'dark' ? Moon : Sun;
  const themeTriggerLabel = getThemeTriggerLabel({ preference, mode: themeMode });
  const logoSrc = themeMode === 'dark' ? ONMARU_LOGO_DARK_SRC : ONMARU_LOGO_LIGHT_SRC;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (themePickerRef.current && !themePickerRef.current.contains(target)) {
        setIsThemePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isThemePickerOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsThemePickerOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isThemePickerOpen]);

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
      {/* 1. 상단 온마루 브랜드 로고 */}
      <LogoArea
        role="button"
        tabIndex={0}
        onClick={() => router.push('/')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push('/');
          }
        }}
        aria-label="온마루 메인 홈으로 이동"
        title="온마루 메인 홈으로 이동"
      >
        <Image
          src={logoSrc}
          alt="온마루 로고"
          width={36}
          height={36}
          style={{ objectFit: 'contain', borderRadius: '10px' }}
          priority
        />
      </LogoArea>

      <LogoDivider />

      {/* 2. 온마루 자체 카테고리 목록 (한옥 이야기, 지도, 소리마루, 수결첩, 저장) */}
      <NavList>
        {/* 온마루 카테고리 1: 한옥 이야기 */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/hanok')}
          aria-label="한옥 이야기"
          title="한옥 이야기"
        >
          <NavItemIcon>
            <BookOpen size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>한옥 이야기</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 2: 지도 (정보지도) */}
        <NavItemBtn
          type="button"
          $active={isMapActive}
          onClick={handleSelectInfoMap}
          aria-label="지도"
          title="지도"
        >
          <NavItemIcon>
            <MapPin size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>지도</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 3: 소리마루 (오디오 해설) */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/sorimaru')}
          aria-label="소리마루"
          title="소리마루"
        >
          <NavItemIcon>
            <Headphones size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>소리마루</NavItemLabel>
        </NavItemBtn>

        {/* 온마루 카테고리 4: 수결첩 (한옥 스탬프북) */}
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/stamps')}
          aria-label="한옥 수결첩"
          title="한옥 수결첩"
        >
          <NavItemIcon>
            <Award size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>수결첩</NavItemLabel>
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
            <Bookmark size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>저장</NavItemLabel>
        </NavItemBtn>
      </NavList>

      {/* 3. 하단 유틸리티 메뉴 (다크모드 전환 / 마이) */}
      <BottomArea>
        <Divider />
        <ThemeRailItemWrap ref={themePickerRef}>
          <NavItemBtn
            type="button"
            $active={preference === 'system'}
            onClick={() => setIsThemePickerOpen((open) => !open)}
            aria-label={themeTriggerLabel}
            title={themeTriggerLabel}
            aria-haspopup="menu"
            aria-expanded={isThemePickerOpen}
          >
            <NavItemIcon>
              <ThemeTriggerIcon size={19} strokeWidth={2} />
            </NavItemIcon>
            <NavItemLabel>{preference === 'system' ? '자동' : getThemePreferenceLabel(preference)}</NavItemLabel>
          </NavItemBtn>

          <AnimatePresence>
            {isThemePickerOpen && (
              <ThemeRailPopover
                role="menu"
                aria-label="화면 모드 선택"
                initial={{ opacity: 0, x: -4, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -4, scale: 0.98 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
              >
                {themeOptions.map((option) => {
                  const active = preference === option;
                  const OptionIcon = option === 'dark' ? Moon : option === 'light' ? Sun : Sparkles;
                  return (
                    <ThemeRailChoiceButton
                      key={option}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      $active={active}
                      onClick={() => {
                        setThemeMode(option);
                        setIsThemePickerOpen(false);
                      }}
                    >
                      <ThemeRailChoiceIcon>
                        <OptionIcon size={15} strokeWidth={2} />
                      </ThemeRailChoiceIcon>
                      <ThemeRailChoiceCopy>
                        <ThemeRailChoiceTitle>{getThemePreferenceLabel(option)}</ThemeRailChoiceTitle>
                        <ThemeRailChoiceSummary>
                          {getThemePreferenceSummary({ preference: option, mode: themeMode })}
                        </ThemeRailChoiceSummary>
                      </ThemeRailChoiceCopy>
                      <ThemeRailChoiceCheck aria-hidden="true">
                        {active ? <Check size={14} strokeWidth={2.4} /> : null}
                      </ThemeRailChoiceCheck>
                    </ThemeRailChoiceButton>
                  );
                })}
              </ThemeRailPopover>
            )}
          </AnimatePresence>
        </ThemeRailItemWrap>
        <NavItemBtn
          type="button"
          $active={false}
          onClick={() => router.push('/auth/login')}
          aria-label="마이 / 로그인"
          title="로그인"
        >
          <NavItemIcon>
            <User size={19} strokeWidth={2} />
          </NavItemIcon>
          <NavItemLabel>마이</NavItemLabel>
        </NavItemBtn>
      </BottomArea>
    </RailContainer>
  );
}
