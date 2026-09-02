'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import type { SectionId } from '@/hanok/types';
import { lightPalette, meok } from '@/design-system/tokens';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  background: rgba(247, 241, 230, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(78, 89, 104, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 5vw, 40px);
  transition: all 0.2s ease;
`;

const LogoLink = styled(Link)`
  font-size: 17px;
  font-weight: 700;
  color: ${meok[900]};
  text-decoration: none;
  letter-spacing: -0.02em;

  &:hover {
    color: ${lightPalette.juhong[500]};
  }
`;

const MenuList = styled.ul`
  display: flex;
  align-items: center;
  gap: 28px;
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 767px) {
    display: none;
  }
`;

const MenuItem = styled.li``;

const MenuAnchor = styled.a<{ $active: boolean }>`
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ $active }) => ($active ? meok[900] : meok[700])};
  text-decoration: none;
  transition: color 0.2s ease;
  letter-spacing: -0.01em;

  &:hover {
    color: ${meok[900]};
  }
`;

const HamburgerBtn = styled.button`
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 28px;
  height: 28px;
  background: transparent;
  cursor: pointer;
  padding: 0;

  @media (max-width: 767px) {
    display: flex;
  }

  span {
    display: block;
    height: 1.5px;
    background: ${meok[900]};
    border-radius: 2px;
    transition: all 0.2s ease;
  }
`;

const MENU_ITEMS: { label: string; href: string; section: SectionId }[] = [
  { label: '한옥 도감', href: '#grid', section: 'grid' },
  { label: '전국 지도', href: '#map', section: 'map' },
  { label: '이달의 한옥', href: '#monthly', section: 'monthly' },
];

interface ArchiveNavProps {
  activeSection: SectionId | null;
}

export default function ArchiveNav({ activeSection }: ArchiveNavProps) {
  return (
    <Nav aria-label="페이지 내 이동">
      <a
        href="#grid"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        onFocus={(e) => {
          (e.target as HTMLAnchorElement).style.left = '16px';
          (e.target as HTMLAnchorElement).style.width = 'auto';
          (e.target as HTMLAnchorElement).style.height = 'auto';
        }}
        onBlur={(e) => {
          (e.target as HTMLAnchorElement).style.left = '-9999px';
          (e.target as HTMLAnchorElement).style.width = '1px';
          (e.target as HTMLAnchorElement).style.height = '1px';
        }}
      >
        본문으로 바로가기
      </a>

      <LogoLink href="/">온마루</LogoLink>

      <MenuList role="list">
        {MENU_ITEMS.map(({ label, href, section }) => (
          <MenuItem key={section}>
            <MenuAnchor
              href={href}
              $active={activeSection === section}
              aria-current={activeSection === section ? 'true' : undefined}
            >
              {label}
            </MenuAnchor>
          </MenuItem>
        ))}
      </MenuList>

      <HamburgerBtn aria-label="메뉴 열기" aria-expanded="false">
        <span />
        <span />
        <span />
      </HamburgerBtn>
    </Nav>
  );
}
