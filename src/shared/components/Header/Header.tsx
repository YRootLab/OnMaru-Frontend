'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import {
  IoSparklesOutline,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoBookOutline,
  IoMapOutline,
  IoHeadsetOutline,
  IoMenuOutline,
  IoCloseOutline,
} from 'react-icons/io5';
import { transientProps } from '@/design-system/styled';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import GlobalMobileTabs from './GlobalMobileTabs';
import MapMobileTabs from '@/map/components/MapMobileTabs';
import { HEADER_EXIT_S } from '@/shared/navigation/mapEntranceTiming';

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
  height: 46px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 16px;
  border-radius: 9999px;

  /* 지도 페이지(데스크톱)는 자체 좌측 네비게이션 레일을 쓰므로 상단바가 필요 없다.
     스크롤 숨김(isHidden)은 기존처럼 단순 슬라이드지만, 지도 진입(isMapPage)은
     아래쪽 경첩을 축으로 위로 접히며 사라지는 flip으로 — 동시에 MapChips가 그
     자리로 떠오르며 카드가 뒤집히듯 교체되는 느낌을 준다. 지속시간은
     mapEntranceTiming의 HEADER_EXIT_S와 반드시 맞춰야 한다. */
  transform: ${({ $isHidden, $isMapPage }) => {
    if ($isMapPage) return 'perspective(900px) rotateX(-100deg)';
    if ($isHidden) return 'translateY(calc(-100% - 24px))';
    return 'perspective(900px) rotateX(0deg) translateY(0)';
  }};
  transform-origin: 50% 100%;
  opacity: ${({ $isMapPage }) => ($isMapPage ? 0 : 1)};
  pointer-events: ${({ $isHidden, $isMapPage }) => ($isHidden || $isMapPage ? 'none' : 'auto')};
  transition:
    transform ${HEADER_EXIT_S}s cubic-bezier(0.16, 1, 0.3, 1),
    opacity ${HEADER_EXIT_S}s ease,
    visibility 0s ${({ $isMapPage }) => ($isMapPage ? HEADER_EXIT_S : 0)}s;
  visibility: ${({ $isMapPage }) => ($isMapPage ? 'hidden' : 'visible')};
  will-change: transform, opacity;
  user-select: none;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    padding: 0 8px 0 14px;
  }

  @media (max-width: 767px) {
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
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
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

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: 767px) {
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

const CenterNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: 1024px) {
    gap: 2px;
  }

  @media (max-width: 767px) {
    display: none;
  }
`;

const NavLink = styled(Link, transientProps)<LandingProps>`
  position: relative;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 13px;
  font-weight: 500;
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

const RightSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileMenuWrapper = styled.div`
  position: relative;
  z-index: 1;
  display: none;
`;

const MobileTabNavWrap = styled.div`
  display: none;
  position: relative;
  z-index: 1;

  @media (max-width: 767px) {
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
  font-family: 'SpoqaHanSansNeo', sans-serif;
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
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 12.5px;
  font-weight: 500;

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLandingLight, setIsLandingLight] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
        <LeftSection>
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

        {/* 가운데: 한옥도감, 지도, 소리마루, 여정 탐색 */}
        <CenterNav>
          <NavLink href="/hanok" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            한옥도감
          </NavLink>

          <NavLink href="/map" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            지도
          </NavLink>

          <NavLink href="/odii" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            소리마루
          </NavLink>

          <NavLink href="/discover" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            <IoSparklesOutline size={13} style={{ marginRight: 4, verticalAlign: '-1px' }} />
            <span>여정 탐색</span>
          </NavLink>

          {IS_DEV && (
            <NavLink href="/dev/icons" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
              아이콘
            </NavLink>
          )}
        </CenterNav>

      {/* 오른쪽 끝: 로그인 */}
      <RightSection>
        <LoginButton href="/auth/login" $isLanding={usesDarkSurface}>
          <span>로그인</span>
          <IoArrowForwardOutline size={12} />
        </LoginButton>
      </RightSection>

      <MobileTabNavWrap>
        <AnimatePresence mode="wait" initial={false}>
          {isMapPage ? (
            <motion.div
              key="map-tabs"
              style={{ width: '100%', height: '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
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
            <IoCloseOutline size={20} />
          ) : (
            <IoMenuOutline size={20} />
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
              <MobileMenuLink href="/hanok" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>한옥도감</MobileMenuLink>
              <MobileMenuLink href="/map" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>지도</MobileMenuLink>
              <MobileMenuLink href="/odii" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>소리마루</MobileMenuLink>
              <MobileMenuLink href="/discover" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IoSparklesOutline size={15} /> 여정 탐색
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
