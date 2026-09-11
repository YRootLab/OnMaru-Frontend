'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { Sparkles, ArrowRight, Menu, X } from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import GlobalMobileTabs from './GlobalMobileTabs';
import MapMobileTabs from '@/features/map/components/MapMobileTabs';
import { HEADER_EXIT_S, ENTRANCE_EASE } from '@/shared/navigation/mapEntranceTiming';
import { useMapEntranceStore } from '@/shared/navigation/mapEntranceState';

/** 캡슐형 GNB의 높이 — /map의 MapChips가 "같은 자리를 이어받는" 느낌을 내려면
 *  이 값을 그대로 써야 한다. */
export const HEADER_HEIGHT = 46;

interface LandingProps {
  $isLanding?: boolean;
  $isOdii?: boolean;
  $isActive?: boolean;
  $isScrolled?: boolean;
  $isHidden?: boolean;
  $isMapPage?: boolean;
}

const NavigationBackdrop = styled(motion.div, transientProps)<LandingProps>`
  position: fixed;
  inset: 0;
  z-index: 99;
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(8, 7, 6, 0.34)' : 'rgba(31, 27, 22, 0.22)')};
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);

  @media (prefers-reduced-motion: reduce) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`;

const HeaderContainer = styled('header', transientProps)<LandingProps>`
  position: fixed;
  top: 14px;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: min(calc(100% - 40px), 1140px);
  height: ${HEADER_HEIGHT}px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 16px;
  border-radius: 9999px;

  /* 지도 페이지(데스크톱)는 자체 좌측 네비게이션 레일을 쓰므로 상단바가 필요 없다 —
     회전(flip) 없이, 스크롤 숨김(isHidden)과 같은 방식으로 위로 자연스럽게
     슬라이드되며 사라진다. 지속시간은 mapEntranceTiming의 HEADER_EXIT_S와
     반드시 맞춰야 한다. */
  transform: translateY(${({ $isHidden, $isMapPage }) => ($isHidden || $isMapPage ? 'calc(-100% - 24px)' : '0')});
  pointer-events: ${({ $isHidden, $isMapPage }) => ($isHidden || $isMapPage ? 'none' : 'auto')};
  transition:
    transform ${HEADER_EXIT_S}s cubic-bezier(${ENTRANCE_EASE.join(', ')}),
    visibility 0s ${({ $isMapPage }) => ($isMapPage ? HEADER_EXIT_S : 0)}s;
  visibility: ${({ $isMapPage }) => ($isMapPage ? 'hidden' : 'visible')};
  will-change: transform;
  user-select: none;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    padding: 0 8px 0 14px;
  }

  /* 지도 페이지는 1024px 미만에서 좌측 네비게이션 레일(MapNavRail)이 사라지고
     BottomSheet/모바일 카테고리 칩으로 전환된다 — 그 전환 지점과 이 하단
     탭바로의 전환 지점이 어긋나면(예전엔 767px), 768~1023px 구간에서 레일도
     탭바도 없는 빈 화면이 생긴다. 그래서 지도 페이지에서는 이 임계값을
     MapNavRail과 동일한 1023px로 맞춘다. 지도 외 페이지는 기존 767px 그대로. */
  @media (max-width: ${({ $isMapPage }) => ($isMapPage ? 1023 : 767)}px) {
    top: auto;
    right: 12px;
    bottom: max(12px, env(safe-area-inset-bottom));
    left: 12px;
    width: auto;
    max-width: none;
    height: 58px;
    padding: 0 8px;
    border-radius: 20px;
    transform: none;
    pointer-events: auto;
    visibility: visible;
    /* 데스크톱 숨김용 transform(translateY -100%-24px)·visibility 지연
       트랜지션을 그대로 물려받으면, top:14px→bottom:12px처럼 보간 불가능한
       값 전환과 맞물려 "0.38초간 안 보이다가 엉뚱한 방향으로 훅 나타나는"
       것처럼 보인다. 이 구간에서는 즉시 전환하고, 실제 "아래서 위로 스프링"
       연출은 안쪽 탭 아이콘(motion.div)이 담당한다. */
    transition: none;
    /* 아이콘이 아래서 위로 스프링을 그리며 올라올 때, 캡슐 테두리 밖으로
       삐져나가지 않고 알약 모양 안에서 자연스럽게 "차오르듯" 드러나야 한다. */
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const HeaderBackdrop = styled('div', transientProps)<LandingProps>`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;

  background: ${({ $isLanding, $isScrolled }) => {
    if ($isLanding) {
      return $isScrolled ? 'rgba(23, 21, 18, 0.78)' : 'rgba(23, 21, 18, 0.46)';
    }
    return $isScrolled ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.75)';
  }};

  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);

  border: 1px solid ${({ $isLanding, $isScrolled }) => {
    if ($isLanding) {
      return $isScrolled ? 'rgba(255, 248, 235, 0.14)' : 'rgba(255, 248, 235, 0.08)';
    }
    return $isScrolled ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  }};

  box-shadow: ${({ $isLanding, $isScrolled }) => {
    if ($isLanding) {
      return $isScrolled
        ? '0 16px 36px -10px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2)'
        : '0 8px 24px -6px rgba(0, 0, 0, 0.3)';
    }
    return $isScrolled
      ? '0 12px 32px -6px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)'
      : '0 6px 20px -4px rgba(0, 0, 0, 0.04)';
  }};

  transition:
    background-color 380ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 380ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 380ms cubic-bezier(0.16, 1, 0.3, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const LeftSection = styled('div', transientProps)<LandingProps>`
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;

  /* 지도 페이지는 MapNavRail과 같은 1023px에서 하단 탭바로 전환된다 —
     HeaderContainer와 동일한 이유로 이 임계값도 맞춰야 한다. */
  @media (max-width: ${({ $isMapPage }) => ($isMapPage ? 1023 : 767)}px) {
    display: none;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 4px 8px;
  border-radius: 9999px;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 0.82;
  }
`;

const CenterNav = styled('nav', transientProps)<LandingProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: 1024px) {
    gap: 2px;
  }

  @media (max-width: ${({ $isMapPage }) => ($isMapPage ? 1023 : 767)}px) {
    display: none;
  }
`;

const NavLink = styled(Link, transientProps)<LandingProps>`
  position: relative;
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: 13px;
  /* 네비게이션은 읽히기만 하면 된다. 강조는 hover 색이 맡는다 */
  font-weight: 400;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 255, 255, 0.82)' : meok[700])};
  text-decoration: none;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 9999px;
  background-color: transparent;
  transition:
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: ${({ $isLanding, $isOdii }) =>
      $isOdii
        ? lightPalette.jangmi[500]
        : $isLanding
          ? '#ffffff'
          : meok[900]};
    background-color: ${({ $isLanding }) =>
      $isLanding ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.03)'};
  }

  &:active {
    background-color: ${({ $isLanding }) =>
      $isLanding ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.055)'};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const RightSection = styled('div', transientProps)<LandingProps>`
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: ${({ $isMapPage }) => ($isMapPage ? 1023 : 767)}px) {
    display: none;
  }
`;

const MobileMenuWrapper = styled.div`
  position: relative;
  z-index: 1;
  display: none;
`;

const MobileTabNavWrap = styled('div', transientProps)<LandingProps>`
  display: none;
  position: relative;
  z-index: 1;

  @media (max-width: ${({ $isMapPage }) => ($isMapPage ? 1023 : 767)}px) {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

const MobileMenuButton = styled('button', transientProps)<LandingProps>`
  width: 34px;
  height: 34px;
  padding: 0;
  display: inline-grid;
  place-items: center;
  color: ${({ $isLanding }) => ($isLanding ? '#faf9f6' : meok[900])};
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 248, 235, 0.1)' : 'rgba(77, 68, 55, 0.06)')};

  border-radius: 10px;
  cursor: pointer;
  transition: background-color 180ms ease, transform 180ms ease;

  &:active { transform: scale(0.96); }
`;

const MobileMenuPanel = styled(motion.nav, transientProps)<LandingProps>`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(280px, calc(100vw - 16px));
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: ${({ $isLanding, $isScrolled }) =>
    $isLanding
      ? $isScrolled ? 'rgba(27, 25, 22, 0.82)' : 'rgba(27, 25, 22, 0.7)'
      : $isScrolled ? 'rgba(247, 247, 246, 0.94)' : 'rgba(250, 250, 249, 0.86)'};
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);

  border-radius: 16px;

`;

const MobileMenuLink = styled(Link, transientProps)<LandingProps>`
  min-height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-radius: 10px;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.9)' : meok[900])};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: 15px;
  text-decoration: none;

  &:active {
    background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 248, 235, 0.12)' : 'rgba(169, 77, 53, 0.1)')};
  }
`;

const MobileMenuDivider = styled('div', transientProps)<LandingProps>`
  height: 1px;
  margin: 4px 6px;
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 248, 235, 0.13)' : 'rgba(33, 30, 25, 0.09)')};
`;

const LoginButton = styled(Link, transientProps)<LandingProps>`
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: 12.5px;
  /* 헤더에서 유일하게 굵은 지점 — 네비가 400이라 이 하나가 확실히 선다 */
  font-weight: 700;

  color: #ffffff;
  background: ${({ $isLanding }) =>
    $isLanding
      ? 'rgba(20, 18, 16, 0.95)'
      : 'rgba(28, 26, 23, 0.94)'};
  border: 1px solid ${({ $isLanding }) =>
    $isLanding ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)'};

  border-radius: 9999px;
  height: 30px;
  padding: 0 13px 0 14px;
  text-decoration: none;
  letter-spacing: -0.01em;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  box-shadow: ${({ $isLanding }) =>
    $isLanding
      ? '0 3px 10px rgba(0, 0, 0, 0.35)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)'};

  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    color: #ffffff;
    background: ${({ $isLanding }) =>
      $isLanding
        ? 'rgba(38, 35, 31, 1)'
        : meok[700]};
    border-color: ${({ $isLanding }) =>
      $isLanding ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.14)'};
    box-shadow: ${({ $isLanding }) =>
      $isLanding
        ? '0 6px 18px rgba(0, 0, 0, 0.45)'
        : '0 6px 18px rgba(0, 0, 0, 0.18)'};

    & > svg {
      transform: translateX(2px);
      transition: transform 200ms ease;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/* 개발 전용 카탈로그 링크 (프로덕션 번들에서는 제거) */
const IS_DEV = process.env.NODE_ENV === 'development';

export default function Header() {
  const pathname = usePathname();
  const isMapPage = pathname.startsWith('/map');
  const isLandingPage = pathname === '/';
  const isOdiiPage = pathname.startsWith('/odii');
  const recordNavigation = useMapEntranceStore((s) => s.recordNavigation);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLandingLight, setIsLandingLight] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // 지도 페이지가 1023px 미만(MapNavRail이 사라지는 지점)으로 좁아졌는지 —
  // 이 값이 바뀌는 순간에 맞춰 하단 탭바 아이콘이 "아래서 위로" 스프링으로
  // 튀어 오르게 한다. CSS 미디어쿼리만으로는 top:14px→bottom:12px 같은
  // 보간 불가능한 값 전환 때문에 애니메이션을 줄 수 없어 JS로 별도 추적한다.
  const [isNarrowMapChrome, setIsNarrowMapChrome] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1023;
  });

  useEffect(() => {
    if (!isMapPage || typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsNarrowMapChrome(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [isMapPage]);

  useEffect(() => {
    recordNavigation(pathname);
  }, [pathname, recordNavigation]);

  // 랜딩은 스크롤에 따라 먹빛 ↔ 한지색 배경이 전환된다.
  // 밝은 구간에서는 다른 페이지와 동일한 라이트 글래스를 사용한다.
  const usesDarkSurface = isLandingPage && !isLandingLight;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let frameId: number | null = null;
    let previousY = window.scrollY;
    let accumulatedDistance = 0;
    let direction: 'up' | 'down' | null = null;
    let headerIsScrolled = false;
    let headerIsHidden = false;
    let landingSurfaceIsLight = false;

    const updateScrolled = (nextValue: boolean) => {
      if (nextValue !== headerIsScrolled) {
        headerIsScrolled = nextValue;
        setIsScrolled(nextValue);
      }
    };

    const updateHidden = (nextValue: boolean) => {
      if (nextValue !== headerIsHidden) {
        headerIsHidden = nextValue;
        setIsHidden(nextValue);
      }
    };

    const updateLandingSurface = (currentY: number) => {
      if (!isLandingPage) return;

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? currentY / scrollable : 0;
      // GlobalBackground의 밝은 한지/계절 구간(0.13~0.38)과 마지막 밝은 구간(0.90~1.0)에 맞춘다.
      const nextIsLight = (progress >= 0.15 && progress <= 0.39) || progress >= 0.88;

      if (nextIsLight !== landingSurfaceIsLight) {
        landingSurfaceIsLight = nextIsLight;
        setIsLandingLight(nextIsLight);
      }
    };

    const updateHeader = () => {
      frameId = null;
      const currentY = window.scrollY;
      const delta = currentY - previousY;

      updateScrolled(currentY > 12);
      updateLandingSurface(currentY);

      if (isMobileMenuOpen || currentY < 80) {
        accumulatedDistance = 0;
        direction = null;
        updateHidden(false);
      } else if (Math.abs(delta) >= 1) {
        const nextDirection = delta > 0 ? 'down' : 'up';
        accumulatedDistance = direction === nextDirection
          ? accumulatedDistance + Math.abs(delta)
          : Math.abs(delta);
        direction = nextDirection;

        // 작은 트랙패드 흔들림에는 반응하지 않고, 의도적인 스크롤에서만 전환한다.
        if (nextDirection === 'down' && accumulatedDistance >= 28) {
          updateHidden(true);
          accumulatedDistance = 0;
        } else if (nextDirection === 'up' && accumulatedDistance >= 12) {
          updateHidden(false);
          accumulatedDistance = 0;
        }
      }

      previousY = currentY;
    };

    const scheduleUpdate = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [isMobileMenuOpen, isLandingPage]);


  const isNavigationOpen = isMobileMenuOpen;

  return (
    <>
      <AnimatePresence>
        {isNavigationOpen && (
          <NavigationBackdrop
            $isLanding={usesDarkSurface}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => {
              setIsMobileMenuOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <HeaderContainer
        $isLanding={usesDarkSurface}
        $isScrolled={isScrolled}
        $isHidden={isHidden}
        $isMapPage={isMapPage}
      >
        <HeaderBackdrop
          $isLanding={usesDarkSurface}
          $isScrolled={isScrolled}
          aria-hidden="true"
        />

        {/* 맨 왼쪽: logo.png */}
        <LeftSection $isMapPage={isMapPage}>
          <LogoLink href="/" aria-label="온마루 홈으로 이동">
            <Image
              src="/logo.png"
              alt="온마루 로고"
              width={90}
              height={24}
              style={{ objectFit: 'contain', height: '24px', width: 'auto' }}
              priority
            />
          </LogoLink>
        </LeftSection>

        {/* 가운데: 한옥 마루, 지도, 소리마루, 여정 탐색 */}
        <CenterNav $isMapPage={isMapPage}>
          <NavLink href="/hanok" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            한옥 마루
          </NavLink>

          <NavLink href="/map" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            지도
          </NavLink>

          <NavLink href="/odii" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            소리마루
          </NavLink>

          <NavLink href="/" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            <Sparkles size={13} style={{ marginRight: 4, verticalAlign: '-1px' }} />
            <span>여정 탐색</span>
          </NavLink>

          {IS_DEV && (
            <NavLink href="/dev/icons" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
              아이콘
            </NavLink>
          )}
        </CenterNav>

      {/* 오른쪽 끝: 로그인 */}
      <RightSection $isMapPage={isMapPage}>
        <LoginButton href="/auth/login" $isLanding={usesDarkSurface}>
          <span>로그인</span>
          <ArrowRight size={12} />
        </LoginButton>
      </RightSection>

      <MobileTabNavWrap $isMapPage={isMapPage}>
        <AnimatePresence mode="wait" initial={false}>
          {isMapPage ? (
            <motion.div
              key="map-tabs"
              style={{ width: '100%', height: '100%' }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: isNarrowMapChrome ? 0 : 26 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.16, ease: 'easeOut' },
                y: { type: 'spring', stiffness: 420, damping: 30 },
              }}
            >
              <MapMobileTabs />
            </motion.div>
          ) : (
            <motion.div
              key="global-tabs"
              style={{ width: '100%', height: '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <GlobalMobileTabs isLanding={usesDarkSurface} />
            </motion.div>
          )}
        </AnimatePresence>
      </MobileTabNavWrap>

      <MobileMenuWrapper ref={mobileMenuRef}>
        <MobileMenuButton
          type="button"
          $isLanding={usesDarkSurface}
          aria-label="메뉴 열기"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </MobileMenuButton>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <MobileMenuPanel
              id="mobile-navigation"
              $isLanding={usesDarkSurface}
              $isScrolled={isScrolled}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <MobileMenuLink href="/hanok" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>한옥 마루</MobileMenuLink>
              <MobileMenuLink href="/map" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>지도</MobileMenuLink>
              <MobileMenuLink href="/odii" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>소리마루</MobileMenuLink>
              <MobileMenuLink href="/" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} /> 여정 탐색
                </span>
              </MobileMenuLink>
              {IS_DEV && (
                <MobileMenuLink href="/dev/icons" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>아이콘 (개발용)</MobileMenuLink>
              )}
              <MobileMenuDivider $isLanding={usesDarkSurface} />
              <MobileMenuLink href="/auth/login" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>로그인</MobileMenuLink>
            </MobileMenuPanel>
          )}
        </AnimatePresence>
      </MobileMenuWrapper>
      </HeaderContainer>
    </>
  );
}
