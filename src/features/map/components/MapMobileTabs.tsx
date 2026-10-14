'use client';

import Link from 'next/link';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { BookOpen01Icon, Bookmark01Icon, Film01Icon, HeadphonesIcon, Home01Icon, MapIcon } from '@hugeicons/core-free-icons';
import { lightPalette, meok, fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';

const Nav = styled.nav`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: stretch;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  color: ${({ $active }) => ($active ? lightPalette.hwanggeum[700] : 'rgba(33, 30, 25, 0.68)')};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.micro};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease;

  &:active {
    transform: scale(0.94);
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? lightPalette.hwanggeum[400] : meok[400])};
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) & {
      color: ${({ $active }) => ($active ? lightPalette.hwanggeum[400] : meok[400])};
    }
  }
`;

const TabLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 0;
  color: rgba(33, 30, 25, 0.68);
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.micro};
  font-weight: 400;
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: color 180ms ease, transform 180ms ease;

  &:active { transform: scale(0.94); }

  [data-theme='dark'] & { color: ${meok[400]}; }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) & { color: ${meok[400]}; }
  }
`;

const IconSlot = styled.span`
  position: relative;
  display: inline-flex;
  width: 19px;
  height: 19px;
`;

const CountBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 9999px;
  background: ${lightPalette.hwanggeum[500]};
  color: #ffffff;

  [data-theme='dark'] & {
    background: ${lightPalette.hwanggeum[400]};
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) & {
      background: ${lightPalette.hwanggeum[400]};
    }
  }
  font-size: ${fontSize.micro};
  font-weight: 700;
  line-height: 1;
`;

export default function MapMobileTabs() {
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);
  const bookmarkCount = useBookmarkStore((s) => s.bookmarks.length);

  const isMapActive = mode === 'info' && category !== 'bookmark';
  const isBookmarkActive = category === 'bookmark';

  return (
    <Nav aria-label="지도 탐색">
      <TabLink href="/" aria-label="홈으로 이동">
        <IconSlot>
          <HugeiconsIcon icon={Home01Icon} size={19} />
        </IconSlot>
        <span>홈</span>
      </TabLink>

      <TabLink href="/hanok" aria-label="한옥마루">
        <IconSlot>
          <HugeiconsIcon icon={BookOpen01Icon} size={19} />
        </IconSlot>
        <span>한옥마루</span>
      </TabLink>

      <TabLink href="/discover" aria-label="K-마루">
        <IconSlot>
          <HugeiconsIcon icon={Film01Icon} size={19} />
        </IconSlot>
        <span>K-마루</span>
      </TabLink>

      <TabLink href="/sorimaru" aria-label="소리마루">
        <IconSlot>
          <HugeiconsIcon icon={HeadphonesIcon} size={19} />
        </IconSlot>
        <span>소리마루</span>
      </TabLink>

      <TabButton
        type="button"
        $active={isMapActive}
        onClick={() => {
          setMode('info');
          if (category === 'bookmark') setCategory(null);
        }}
        aria-label="지도마루"
      >
        <IconSlot>
          <HugeiconsIcon icon={MapIcon} size={19} />
        </IconSlot>
        <span>지도마루</span>
      </TabButton>

      <TabButton
        type="button"
        $active={isBookmarkActive}
        onClick={() => {
          setMode('info');
          setCategory('bookmark');
          setSheetSnap('half');
        }}
        aria-label="모음마루"
      >
        <IconSlot>
          <HugeiconsIcon icon={Bookmark01Icon} size={19} fill={isBookmarkActive ? 'currentColor' : 'none'} />
          {bookmarkCount > 0 && <CountBadge>{bookmarkCount}</CountBadge>}
        </IconSlot>
        <span>모음마루</span>
      </TabButton>
    </Nav>
  );
}
