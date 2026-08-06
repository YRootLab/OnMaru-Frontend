'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface LandingProps {
  $isLanding?: boolean;
}

const shouldNotForwardLanding = (prop: string) => prop !== '$isLanding' && prop !== 'isLanding';

const HeaderContainer = styled('header', {
  shouldForwardProp: shouldNotForwardLanding,
})<LandingProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 49px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 75px;

  @media (max-width: 1279px) {
    padding: 0 16px;
  }

  background: ${({ $isLanding }) => ($isLanding ? 'rgba(20, 18, 15, 0.72)' : '#ffffff')};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid ${({ $isLanding }) => ($isLanding ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 0, 0, 0.06)')};
  box-shadow: ${({ $isLanding }) => ($isLanding ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 12px rgba(0, 0, 0, 0.04)')};
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  user-select: none;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
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
  gap: 36px;
  height: 100%;
`;

const NavLink = styled(Link, {
  shouldForwardProp: shouldNotForwardLanding,
})<LandingProps>`
  position: relative;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.88)' : '#211e19')};
  text-decoration: none;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  height: 100%;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ $isLanding }) => ($isLanding ? '#d4af37' : '#a94d35')};
  }
`;

const DropdownWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
`;

const DropdownTrigger = styled('button', {
  shouldForwardProp: shouldNotForwardLanding,
})<LandingProps>`
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.88)' : '#211e19')};
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ $isLanding }) => ($isLanding ? '#d4af37' : '#a94d35')};
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

const DropdownMenu = styled(motion.div, {
  shouldForwardProp: shouldNotForwardLanding,
})<LandingProps>`
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 140px;
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(28, 25, 22, 0.94)' : '#ffffff')};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${({ $isLanding }) => ($isLanding ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0, 0, 0, 0.08)')};
  border-radius: 10px;
  padding: 6px;
  box-shadow: ${({ $isLanding }) => ($isLanding ? '0 12px 32px rgba(0, 0, 0, 0.45)' : '0 10px 28px rgba(0, 0, 0, 0.12)')};
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 101;
`;

const DropdownItem = styled(Link, {
  shouldForwardProp: shouldNotForwardLanding,
})<LandingProps>`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.88)' : '#211e19')};
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ $isLanding }) => ($isLanding ? 'rgba(212, 175, 55, 0.12)' : 'rgba(169, 77, 53, 0.08)')};
    color: ${({ $isLanding }) => ($isLanding ? '#d4af37' : '#a94d35')};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const LoginButton = styled(Link, {
  shouldForwardProp: shouldNotForwardLanding,
})<LandingProps>`
  position: relative;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $isLanding }) => ($isLanding ? 'rgba(250, 250, 250, 0.92)' : '#1c1a17')};
  background: ${({ $isLanding }) => ($isLanding ? 'rgba(255, 255, 255, 0.08)' : 'rgba(28, 26, 23, 0.04)')};
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  text-decoration: none;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ $isLanding }) => ($isLanding ? '#faf8f5' : '#1c1a17')};
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 0;
  }

  & > span,
  & > svg {
    position: relative;
    z-index: 1;
    transition: color 0.25s ease, stroke 0.25s ease, transform 0.25s ease;
  }

  &:hover {
    color: ${({ $isLanding }) => ($isLanding ? '#1c1a17' : '#faf8f5')};
    box-shadow: ${({ $isLanding }) => ($isLanding ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 4px 14px rgba(28, 26, 23, 0.12)')};

    &::before {
      transform: scaleX(1);
      transform-origin: left;
    }

    & > svg {
      transform: translateX(2px);
      stroke: ${({ $isLanding }) => ($isLanding ? '#1c1a17' : '#faf8f5')};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

export default function Header() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMapMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <HeaderContainer $isLanding={isLandingPage}>
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
        <NavLink href="/hanok" $isLanding={isLandingPage}>
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
            $isLanding={isLandingPage}
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
                $isLanding={isLandingPage}
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <DropdownItem
                  href="/map"
                  $isLanding={isLandingPage}
                  onClick={() => setIsMapMenuOpen(false)}
                >
                  정보지도
                </DropdownItem>
                <DropdownItem
                  href="/map?mode=warmth"
                  $isLanding={isLandingPage}
                  onClick={() => setIsMapMenuOpen(false)}
                >
                  온기지도
                </DropdownItem>
              </DropdownMenu>
            )}
          </AnimatePresence>
        </DropdownWrapper>

        <NavLink href="/odii" $isLanding={isLandingPage}>
          소리마루
        </NavLink>
      </CenterNav>

      {/* 오른쪽 끝: 로그인 */}
      <RightSection>
        <LoginButton href="/auth/login" $isLanding={isLandingPage}>
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
    </HeaderContainer>
  );
}
