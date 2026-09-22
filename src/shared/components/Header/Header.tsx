'use client';

import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { ArrowRight, Check, Menu, X, Sparkles, BookOpen, Map, Headphones, Sun, Moon } from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { lightPalette, meok, fontSize, ringShadow } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import {
  getThemePreferenceLabel,
  getThemePreferenceSummary,
  getThemeTriggerLabel,
} from '@/design-system/themePreferenceLabels';
import type { ThemePreference } from '@/design-system/tokens';
import { useAuth } from '@/features/auth';
import GlobalMobileTabs from './GlobalMobileTabs';
import { HEADER_EXIT_S, ENTRANCE_EASE } from '@/shared/navigation/mapEntranceTiming';
import { useMapEntranceStore } from '@/shared/navigation/mapEntranceState';
import { shouldUseLandingDarkSurface } from './headerSurface';
import { useJourneyStore } from '@/features/journey-curator/store/useJourneyStore';



export const HEADER_HEIGHT = 46;
const ONMARU_LOGO_SRC = '/logo.png';

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

interface LandingProps {
  $isLanding?: boolean;
  $isSoriMaru?: boolean;
  $isSorimaru?: boolean;
  $isActive?: boolean;
  $isScrolled?: boolean;
  $isHidden?: boolean;
  $isMapPage?: boolean;
  $isAuto?: boolean;
  $active?: boolean;
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
    transition: none;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  body[data-sorimaru-player-open='true'] & {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
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
      return $isScrolled ? 'rgba(23, 21, 18, 0.98)' : 'rgba(23, 21, 18, 0.92)';
    }
    return $isScrolled ? '#ffffff' : 'rgba(255, 255, 255, 0.96)';
  }};

  border: 1px solid ${({ $isLanding, $isScrolled }) => {
    if ($isLanding) {
      return $isScrolled ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.07)';
    }
    return $isScrolled ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.35)';
  }};

  box-shadow: ${ringShadow.light.card};

  transition:
    background-color 380ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 380ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 380ms cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: ${({ $isLanding, $isScrolled }) => {
      if ($isLanding) {
        return $isScrolled ? 'rgba(23, 21, 18, 0.98)' : 'rgba(23, 21, 18, 0.92)';
      }
      return $isScrolled ? 'rgba(28, 26, 23, 0.98)' : 'rgba(28, 26, 23, 0.95)';
    }};
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: ${ringShadow.dark.card};
  }
`;

const LeftSection = styled('div', transientProps)<LandingProps>`
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: ${({ $isMapPage }) => ($isMapPage ? 1023 : 767)}px) {
    display: none;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 7px;
  height: 100%;
  padding: 4px 6px;
  border-radius: 9999px;
  text-decoration: none;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 0.82;
  }
`;

const LogoTitle = styled.span<{ $isLanding?: boolean }>`
  font-family: var(--font-hanok);
  font-weight: 900;
  font-size: 1.05rem;
  letter-spacing: -0.03em;
  color: ${({ $isLanding }) => ($isLanding ? '#ffffff' : meok[900])};
  white-space: nowrap;

  [data-theme='dark'] & {
    color: #ffffff;
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
  font-size: ${fontSize.xs};
  font-weight: ${({ $isActive }) => ($isActive ? 700 : 400)};
  color: ${({ $isLanding, $isActive }) => {
    if ($isActive) {
      return $isLanding ? '#ffffff' : meok[900];
    }
    return $isLanding ? 'rgba(255, 255, 255, 0.82)' : meok[700];
  }};
  text-decoration: none;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 9999px;
  background-color: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition: color 180ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: ${({ $isLanding }) => ($isLanding ? '#ffffff' : meok[900])};
  }

  [data-theme='dark'] & {
    color: ${({ $isLanding, $isActive }) => {
      if ($isActive) {
        return '#ffffff';
      }
      return $isLanding ? 'rgba(255, 255, 255, 0.82)' : meok[200];
    }};
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;

    &:hover {
      color: #ffffff;
    }
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


const MobileTopBar = styled('div', transientProps)<LandingProps>`

  display: none;


  ${({ $isMapPage }) =>
    !$isMapPage &&
    `
    @media (max-width: 767px) {
      display: flex;
      align-items: center;
      position: relative;
      z-index: 100;
      padding: max(16px, env(safe-area-inset-top)) 16px 0;
      margin-bottom: 32px;


      background: transparent;
      border: none;
      box-shadow: none;
    }
  `}

  body[data-sorimaru-player-open='true'] & {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
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

  [data-theme='dark'] & {
    color: #faf9f6;
    background: rgba(255, 248, 235, 0.1);
  }
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

  [data-theme='dark'] & {
    background: ${({ $isScrolled }) =>
      $isScrolled ? 'rgba(27, 25, 22, 0.94)' : 'rgba(27, 25, 22, 0.88)'};
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const MobileMenuLink = styled(Link, transientProps)<LandingProps>`
  min-height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-radius: 10px;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.9)' : meok[900])};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.sm};
  text-decoration: none;

  &:active {
    background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 248, 235, 0.12)' : 'rgba(169, 77, 53, 0.1)')};
  }

  [data-theme='dark'] & {
    color: rgba(250, 250, 250, 0.9);

    &:active {
      background: rgba(255, 248, 235, 0.12);
    }
  }
`;

const MobileMenuDivider = styled('div', transientProps)<LandingProps>`
  height: 1px;
  margin: 4px 6px;
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 248, 235, 0.13)' : 'rgba(33, 30, 25, 0.09)')};

  [data-theme='dark'] & {
    background: rgba(255, 248, 235, 0.13);
  }
`;

const LoginButton = styled(Link, transientProps)<LandingProps>`
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.xs};
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

  [data-theme='dark'] & {
    color: #ffffff;
    background: rgba(20, 18, 16, 0.95);
    border-color: rgba(255, 255, 255, 0.16);

    &:hover {
      background: rgba(38, 35, 31, 1);
      border-color: rgba(255, 255, 255, 0.25);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ThemeToggleBtn = styled('button', transientProps)<LandingProps>`
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  border: 1px solid ${({ $isLanding }) => ($isLanding ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)')};
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')};
  color: ${({ $isLanding }) => ($isLanding ? '#ffffff' : meok[700])};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 0;
  transition: all 180ms ease;

  &:hover {
    background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)')};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.95);
  }

  ${({ $isAuto, $isLanding }) => $isAuto ? `
    &::after {
      content: '';
      position: absolute;
      right: 4px;
      bottom: 4px;
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: ${$isLanding ? '#ffffff' : meok[700]};
      box-shadow: 0 0 0 2px ${$isLanding ? 'rgba(20, 18, 16, 0.95)' : 'rgba(255, 255, 255, 0.82)'};
    }
  ` : ''}

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;

    &:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    &::after {
      background: #ffffff;
      box-shadow: 0 0 0 2px rgba(28, 26, 23, 0.9);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ThemePickerWrap = styled.div`
  position: relative;
  display: inline-flex;
  margin-right: 6px;
`;

const ThemePickerPopover = styled(motion.div, transientProps)<LandingProps>`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 214px;
  padding: 6px;
  border-radius: 16px;
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(27, 25, 22, 0.9)' : 'rgba(250, 250, 249, 0.94)')};
  border: 1px solid ${({ $isLanding }) => ($isLanding ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')};
  box-shadow: ${({ $isLanding }) =>
    $isLanding
      ? '0 16px 36px rgba(0, 0, 0, 0.32)'
      : '0 16px 36px rgba(0, 0, 0, 0.12)'};
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  z-index: 3;
  transform-origin: top right;

  [data-theme='dark'] & {
    background: rgba(27, 25, 22, 0.94);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.36);
  }
`;

const ThemeChoiceButton = styled('button', transientProps)<LandingProps>`
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 12px;
  padding: 8px 9px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 8px;
  background: ${({ $active, $isLanding }) =>
    $active
      ? $isLanding ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.055)'
      : 'transparent'};
  color: ${({ $isLanding }) => ($isLanding ? '#ffffff' : meok[900])};
  cursor: pointer;
  text-align: left;
  transition: background-color 160ms ease;

  &:hover {
    background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.045)')};
  }

  [data-theme='dark'] & {
    color: #ffffff;
    background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.12)' : 'transparent')};

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const ThemeChoiceIcon = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ThemeChoiceCopy = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ThemeChoiceTitle = styled.span`
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.xs};
  font-weight: 700;
  line-height: 1.2;
`;

const ThemeChoiceSummary = styled.span`
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(87, 79, 68, 0.76);

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.66);
  }
`;

const ThemeChoiceCheck = styled.span`
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export default function Header() {
  const pathname = usePathname();
  const isMapPage = pathname.startsWith('/map');
  const isLandingPage = pathname === '/';
  const isSoriMaruPage = pathname.startsWith('/sorimaru') || pathname.startsWith('/sorimaru');
  const recordNavigation = useMapEntranceStore((s) => s.recordNavigation);
  const resetJourney = useJourneyStore((s) => s.resetJourney);
  const { user, isLoggedIn } = useAuth();
  const { preference, mode: themeMode, setMode } = useOnmaruTheme();
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const renderedPreference = hasHydrated ? preference : 'system';
  const renderedThemeMode = hasHydrated ? themeMode : 'light';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLandingLight, setIsLandingLight] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const themePickerRef = useRef<HTMLDivElement>(null);

  const [isNarrowMapChrome, setIsNarrowMapChrome] = useState(false);

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

  const usesDarkSurface = shouldUseLandingDarkSurface({
    isLandingPage,
    isLandingLight,
    themeMode: renderedThemeMode,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
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
      const nextIsLight = (progress >= 0.15 && progress <= 0.39) || progress >= 0.88;

      if (nextIsLight !== landingSurfaceIsLight) {
        landingSurfaceIsLight = nextIsLight;
        setIsLandingLight(nextIsLight);
      }
    };

    const updateHeader = () => {
      frameId = null;
      if (document.body.dataset.sorimaruPlayerOpen === 'true') {
        return;
      }
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
  const themeOptions: ThemePreference[] = ['system', 'light', 'dark'];
  const ThemeTriggerIcon = renderedThemeMode === 'dark' ? Moon : Sun;
  const themeTriggerLabel = getThemeTriggerLabel({
    preference: renderedPreference,
    mode: renderedThemeMode,
  });

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

      <MobileTopBar $isLanding={usesDarkSurface}$isMapPage={isMapPage}>
        <LogoLink href="/" aria-label="온마루 홈으로 이동" onClick={resetJourney}>
          <Image
            src={ONMARU_LOGO_SRC}
            alt="온마루 로고"
            width={26}
            height={26}
            style={{ objectFit: 'contain', height: '26px', width: '26px', borderRadius: '6px' }}
          />
        </LogoLink>
      </MobileTopBar>

      <HeaderContainer
        $isLanding={usesDarkSurface}$isScrolled={isScrolled}
        $isHidden={isHidden}$isMapPage={isMapPage}
      >
        <HeaderBackdrop
          $isLanding={usesDarkSurface}$isScrolled={isScrolled}
          aria-hidden="true"
        />


        {}
        <LeftSection $isMapPage={isMapPage}>
          <LogoLink href="/" aria-label="온마루 홈으로 이동" onClick={resetJourney}>
            <Image
              src={ONMARU_LOGO_SRC}
              alt="온마루 로고"
              width={26}
              height={26}
              style={{ objectFit: 'contain', height: '26px', width: '26px', borderRadius: '6px' }}
              priority
            />
          </LogoLink>
        </LeftSection>

        {}
        <CenterNav $isMapPage={isMapPage}>
          {[
            { href: '/', label: '홈', icon: Sparkles, active: pathname === '/' },
            { href: '/hanok', label: '한옥 이야기', icon: BookOpen, active: pathname.startsWith('/hanok') },
            { href: '/sorimaru', label: '소리마루', icon: Headphones, active: isSoriMaruPage },
            { href: '/map', label: '지도', icon: Map, active: pathname.startsWith('/map') },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = item.active;
            return (
              <NavLink
                key={item.href}
                href={item.href}
                $isLanding={usesDarkSurface}
                $isSoriMaru={isSoriMaruPage}$isActive={isSelected}
                onClick={item.href === '/' ? resetJourney : undefined}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center' }}>
                  <Icon size={13} style={{ marginRight: 5, verticalAlign: '-1px' }} />
                  <span>{item.label}</span>
                </span>
              </NavLink>
            );
          })}
        </CenterNav>

      {}
      <RightSection $isMapPage={isMapPage} ref={themePickerRef}>
        <ThemePickerWrap>
          <ThemeToggleBtn
            type="button"
            $isLanding={usesDarkSurface}$isAuto={renderedPreference === 'system'}
            onClick={() => setIsThemePickerOpen((open) => !open)}
            title={themeTriggerLabel}
            aria-label={themeTriggerLabel}
            aria-haspopup="menu"
            aria-expanded={isThemePickerOpen}
          >
            <ThemeTriggerIcon size={14} />
          </ThemeToggleBtn>

        </ThemePickerWrap>

        <LoginButton href={isLoggedIn ? '/mypage' : '/auth/login'} $isLanding={usesDarkSurface}>
          <span>{isLoggedIn ? (user?.nickname ?? '마이페이지') : '로그인'}</span>
          <ArrowRight size={12} />
        </LoginButton>

        <AnimatePresence>
          {isThemePickerOpen && (
            <ThemePickerPopover
              $isLanding={usesDarkSurface}
              role="menu"
              aria-label="화면 모드 선택"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              {themeOptions.map((option) => {
                const active = renderedPreference === option;
                const OptionIcon = option === 'dark' ? Moon : option === 'light' ? Sun : Sparkles;
                return (
                  <ThemeChoiceButton
                    key={option}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    $active={active}$isLanding={usesDarkSurface}
                    onClick={() => {
                      setMode(option);
                      setIsThemePickerOpen(false);
                    }}
                  >
                    <ThemeChoiceIcon>
                      <OptionIcon size={15} strokeWidth={2} />
                    </ThemeChoiceIcon>
                    <ThemeChoiceCopy>
                      <ThemeChoiceTitle>{getThemePreferenceLabel(option)}</ThemeChoiceTitle>
                      <ThemeChoiceSummary>
                        {getThemePreferenceSummary({ preference: option, mode: renderedThemeMode })}
                      </ThemeChoiceSummary>
                    </ThemeChoiceCopy>
                    <ThemeChoiceCheck aria-hidden="true">
                      {active ? <Check size={14} strokeWidth={2.4} /> : null}
                    </ThemeChoiceCheck>
                  </ThemeChoiceButton>
                );
              })}
            </ThemePickerPopover>
          )}
        </AnimatePresence>
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
              <GlobalMobileTabs isLanding={usesDarkSurface} />
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
          aria-label="메뉴"
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
              $isLanding={usesDarkSurface}$isScrolled={isScrolled}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <MobileMenuLink
                href="/"
                $isLanding={usesDarkSurface}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  resetJourney();
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} /> 홈
                </span>
              </MobileMenuLink>
              <MobileMenuLink href="/hanok" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={15} /> 한옥 이야기
                </span>
              </MobileMenuLink>
              <MobileMenuLink href="/sorimaru" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Headphones size={15} /> 소리마루
                </span>
              </MobileMenuLink>
              <MobileMenuLink href="/map" $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Map size={15} /> 지도
                </span>
              </MobileMenuLink>
              <MobileMenuDivider $isLanding={usesDarkSurface} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: usesDarkSurface ? 'rgba(250, 250, 250, 0.75)' : meok[700],
                  }}
                >
                  화면 모드
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['light', 'dark', 'system'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setMode(opt)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        border: 'none',
                        background:
                          renderedPreference === opt ? 'rgba(0, 184, 130, 0.2)' : 'transparent',
                        color:
                          renderedPreference === opt
                            ? '#00b882'
                            : usesDarkSurface
                            ? '#a1a1aa'
                            : meok[700],
                        fontSize: '12px',
                        fontWeight: renderedPreference === opt ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {opt === 'light' ? '라이트' : opt === 'dark' ? '다크' : '시스템'}
                    </button>
                  ))}
                </div>
              </div>
              <MobileMenuLink href={isLoggedIn ? '/mypage' : '/auth/login'} $isLanding={usesDarkSurface} onClick={() => setIsMobileMenuOpen(false)}>
                {isLoggedIn ? (user?.nickname ?? '마이페이지') : '로그인'}
              </MobileMenuLink>
            </MobileMenuPanel>
          )}
        </AnimatePresence>
      </MobileMenuWrapper>
      </HeaderContainer>
    </>
  );
}