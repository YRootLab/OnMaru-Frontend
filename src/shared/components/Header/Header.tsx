'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { transientProps } from '@/design-system/styled';
import { lightPalette, meok, surface } from '@/design-system/tokens';

interface LandingProps {
  $isLanding?: boolean;
  $isOdii?: boolean;
  $isActive?: boolean;
  $isScrolled?: boolean;
  $isHidden?: boolean;
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
  top: 12px;
  left: 24px;
  right: 24px;
  height: 54px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-radius: 16px;

  @media (max-width: 1279px) {
    padding: 0 16px;
  }

  @media (max-width: 767px) {
    top: auto;
    right: 12px;
    bottom: max(12px, env(safe-area-inset-bottom));
    left: 12px;
    height: 64px;
    padding: 0 8px;
    border-radius: 20px;
    transform: none;
  }

  background: ${({ $isLanding, $isScrolled }) =>
    $isLanding
      ? $isScrolled ? 'rgba(27, 25, 22, 0.74)' : 'rgba(27, 25, 22, 0.56)'
      : $isScrolled ? 'rgba(247, 247, 246, 0.88)' : 'rgba(250, 250, 249, 0.74)'};
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border-bottom: 1px solid ${({ $isLanding, $isScrolled }) =>
    $isLanding
      ? $isScrolled ? 'rgba(255, 248, 235, 0.18)' : 'rgba(255, 248, 235, 0.13)'
      : $isScrolled ? 'rgba(33, 30, 25, 0.12)' : 'rgba(33, 30, 25, 0.08)'};
  box-shadow: 0 12px 34px -10px rgba(33, 30, 25, 0.07);

  transform: translateY(${({ $isHidden }) => ($isHidden ? 'calc(-100% - 16px)' : '0')});
  transition:
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 260ms ease,
    border-color 260ms ease,
    box-shadow 260ms ease,
    backdrop-filter 260ms ease;
  will-change: transform;
  user-select: none;

  @media (max-width: 767px) {
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;

  @media (max-width: 767px) {
    display: none;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  height: 100%;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }
`;

const CenterNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 32px;
  height: 100%;

  @media (max-width: 640px) {
    gap: 16px;
  }

  @media (max-width: 767px) {
    display: none;
  }
`;

const NavLink = styled(Link, transientProps)<LandingProps>`
  position: relative;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.88)' : meok[900])};
  text-decoration: none;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  height: 100%;
  transition: color 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 11px;
    left: 0;
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    color: ${({ $isLanding, $isOdii }) => ($isOdii ? lightPalette.jangmi[500] : $isLanding ? lightPalette.hwanggeum[400] : lightPalette.juhong[700])};

    &::after {
      transform: scaleX(1);
      transform-origin: left;
    }
  }
`;

const DropdownWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
`;

const DropdownTrigger = styled('button', transientProps)<LandingProps>`
  background: none;

  outline: none;
  cursor: pointer;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.88)' : meok[900])};
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ $isLanding, $isOdii }) => ($isOdii ? lightPalette.jangmi[500] : $isLanding ? lightPalette.hwanggeum[400] : lightPalette.juhong[700])};
  }
`;

const ChevronIcon = styled(motion.svg)`
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const DropdownMenu = styled(motion.div, transientProps)<LandingProps>`
  position: absolute;
  top: calc(100% + 10px);
  /* 메뉴 텍스트의 시작선을 트리거 "지도"의 첫 글자와 맞춘다. */
  left: -14px;
  min-width: 148px;
  background: ${({ $isLanding, $isScrolled }) =>
    $isLanding
      ? $isScrolled ? 'rgba(27, 25, 22, 0.74)' : 'rgba(27, 25, 22, 0.56)'
      : $isScrolled ? 'rgba(247, 247, 246, 0.9)' : 'rgba(250, 250, 249, 0.78)'};
  backdrop-filter: blur(${({ $isScrolled }) => ($isScrolled ? '22px' : '16px')}) saturate(150%);
  -webkit-backdrop-filter: blur(${({ $isScrolled }) => ($isScrolled ? '22px' : '16px')}) saturate(150%);

  border-radius: 16px;
  padding: 4px;

  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 101;
`;

const DropdownItem = styled(Link, transientProps)<LandingProps>`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.88)' : meok[900])};
  text-decoration: none;
  min-height: 40px;
  padding: 8px 10px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(212, 32, 88, 0.12);
    /* 전역 링크 스타일이나 브라우저 방문 링크 색상이 섞이지 않도록 기본 글자색을 고정한다. */
    color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.88)' : meok[900])};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;

  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileMenuWrapper = styled.div`
  position: relative;
  display: none;

`;

const MobileTabNav = styled.nav`
  display: none;

  @media (max-width: 767px) {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: stretch;
  }
`;

const MobileTabLink = styled(Link, transientProps)<LandingProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  color: ${({ $isLanding, $isOdii, $isActive }) => {
    if ($isActive && $isOdii) return lightPalette.jangmi[500];
    if ($isActive) return $isLanding ? '#f8e6bd' : lightPalette.juhong[700];
    return $isLanding ? 'rgba(250, 250, 250, 0.68)' : 'rgba(33, 30, 25, 0.68)';
  }};
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 10px;
  font-weight: ${({ $isActive }) => ($isActive ? 600 : 400)};
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: color 180ms ease, transform 180ms ease;

  &:active { transform: scale(0.94); }
`;

const MobileTabIcon = styled.svg`
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
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
  font-size: 13px;
  font-weight: 500;

  color: ${({ $isLanding, $isOdii }) => ($isOdii ? surface.light.card : $isLanding ? meok[900] : surface.light.base)};
  background: ${({ $isLanding, $isOdii }) => ($isOdii ? lightPalette.jangmi[500] : $isLanding ? 'rgba(250, 247, 240, 0.92)' : 'rgba(38, 35, 31, 0.92)')};

  border-radius: 999px;
  height: 32px;
  padding: 0 13px 0 17px;
  text-decoration: none;
  letter-spacing: -0.01em;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;

  &:hover {

    background: ${({ $isLanding, $isOdii }) => ($isOdii ? lightPalette.jangmi[400] : $isLanding ? surface.light.card : meok[700])};


    transform: translateY(-1px);

    & > svg { transform: translateX(1px); }
  }

  &:active {
    transform: translateY(1px);
  }
`;

export default function Header() {
  const pathname = usePathname();
  const isMapPage = pathname.startsWith('/map');
  const isLandingPage = pathname === '/';
  const isOdiiPage = pathname.startsWith('/odii');
  const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLandingLight, setIsLandingLight] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // 랜딩은 스크롤에 따라 먹빛 ↔ 한지색 배경이 전환된다.
  // 밝은 구간에서는 다른 페이지와 동일한 라이트 글래스를 사용한다.
  const usesDarkSurface = isLandingPage && !isLandingLight;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsMapMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) setIsMobileMenuOpen(false);
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

      if (isMapMenuOpen || isMobileMenuOpen || currentY < 80) {
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
  }, [isMapMenuOpen, isMobileMenuOpen, isLandingPage]);

  // 지도 페이지에서는 전체 화면 지도 몰입을 위해 전역 헤더를 숨긴다.
  if (isMapPage) return null;

  const isNavigationOpen = isMapMenuOpen || isMobileMenuOpen;

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
              setIsMapMenuOpen(false);
              setIsMobileMenuOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <HeaderContainer
        $isLanding={usesDarkSurface}
        $isScrolled={isScrolled}
        $isHidden={isHidden}
      >
        {/* 맨 왼쪽: logo.png */}
        <LeftSection>
          <LogoLink href="/" aria-label="온마루 홈으로 이동">
            <Image
              src="/logo.png"
              alt="온마루 로고"
              width={110}
              height={32}
              style={{ objectFit: 'contain', height: '32px', width: 'auto' }}
              priority
            />
          </LogoLink>
        </LeftSection>

        {/* 가운데: 한옥도감, 지도 (드롭다운), 소리마루 */}
        <CenterNav>
          <NavLink href="/hanok" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            한옥도감
          </NavLink>

          <DropdownWrapper
            ref={dropdownRef}
            onMouseEnter={() => setIsMapMenuOpen(true)}
            onMouseLeave={() => setIsMapMenuOpen(false)}
          >
            <DropdownTrigger
              type="button"
              onClick={() => setIsMapMenuOpen((prev) => !prev)}
              aria-expanded={isMapMenuOpen}
              aria-haspopup="true"
              $isLanding={usesDarkSurface}
              $isOdii={isOdiiPage}
            >
              지도
              <ChevronIcon
                viewBox="0 0 24 24"
                animate={{ rotate: isMapMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </ChevronIcon>
            </DropdownTrigger>

            <AnimatePresence>
              {isMapMenuOpen && (
                <DropdownMenu
                  $isLanding={usesDarkSurface}
                  $isScrolled={isScrolled}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <DropdownItem
                    href="/map"
                    $isLanding={usesDarkSurface}
                    $isOdii={isOdiiPage}
                    onClick={() => setIsMapMenuOpen(false)}
                  >
                    정보지도
                  </DropdownItem>
                  <DropdownItem
                    href="/map?mode=warmth"
                    $isLanding={usesDarkSurface}
                    $isOdii={isOdiiPage}
                    onClick={() => setIsMapMenuOpen(false)}
                  >
                    온기지도
                  </DropdownItem>
                </DropdownMenu>
              )}
            </AnimatePresence>
          </DropdownWrapper>

          <NavLink href="/odii" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
            소리마루
          </NavLink>

          {/* 임시 UI 비교 페이지 링크: 스터디 종료 후 이 블록만 제거 */}
          <NavLink
            href="/odii/section2-ui-improvements"
            $isLanding={usesDarkSurface}
            $isOdii={isOdiiPage}
          >
            임시 카드들
          </NavLink>
        </CenterNav>

      {/* 오른쪽 끝: 로그인 */}
      <RightSection>
        <LoginButton href="/auth/login" $isLanding={usesDarkSurface} $isOdii={isOdiiPage}>
          <span>로그인</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </LoginButton>
      </RightSection>

      <MobileTabNav aria-label="주요 탐색">
        <MobileTabLink href="/" $isLanding={usesDarkSurface} $isActive={pathname === '/'}>
          <MobileTabIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v11h14V9" />
            <path d="M9 20v-6h6v6" />
          </MobileTabIcon>
          <span>홈</span>
        </MobileTabLink>
        <MobileTabLink href="/hanok" $isLanding={usesDarkSurface} $isActive={pathname.startsWith('/hanok')}>
          <MobileTabIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6.5h16" />
            <path d="M6 4h12v16H6z" />
            <path d="M9 10h6M9 14h6" />
          </MobileTabIcon>
          <span>한옥도감</span>
        </MobileTabLink>
        <MobileTabLink href="/map" $isLanding={usesDarkSurface} $isActive={pathname.startsWith('/map')}>
          <MobileTabIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
            <path d="M9 3v15M15 6v15" />
          </MobileTabIcon>
          <span>지도</span>
        </MobileTabLink>
        <MobileTabLink href="/odii" $isLanding={usesDarkSurface} $isOdii $isActive={isOdiiPage}>
          <MobileTabIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 14v-4M8 18V6M12 15V9M16 20V4M20 14v-4" />
          </MobileTabIcon>
          <span>오디</span>
        </MobileTabLink>
      </MobileTabNav>

      <MobileMenuWrapper ref={mobileMenuRef}>
        <MobileMenuButton
          type="button"
          $isLanding={usesDarkSurface}
          aria-label="메뉴 열기"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
            transition={{ duration: 0.18 }}
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </motion.svg>
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
              <MobileMenuLink href="/map" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>정보지도</MobileMenuLink>
              <MobileMenuLink href="/map?mode=warmth" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>온기지도</MobileMenuLink>
              <MobileMenuLink href="/odii" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>소리마루</MobileMenuLink>
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
